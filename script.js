var Task=function(description,personName,hours){
	this.description=description;
	this.personName=personName;
	this.hours=hours;
}
Task.prototype.toString=function(){
	return "Description: "+this.description+", Assigned to: "+this.personName+", Estimated hours: "+this.hours+", Hours spent on the task: "+(this.hoursSpent||0)+", Percentage of the task completed: "+(this.percentageCompleted||0)+", Difference between estimated hours and hours spent: "+(this.hoursDiff||0);
}

var TaskStarted=function(description,personName,hours,percentageCompleted,hoursSpent){
	Task.call(this,description,personName,hours);
	this.percentageCompleted=percentageCompleted;
	this.hoursSpent=hoursSpent;
}
TaskStarted.prototype=Object.create(Task.prototype);
TaskStarted.prototype.constructor=TaskStarted;
var TaskFinished=function(description,personName,hours,hoursSpent){
	Task.call(this,description,personName,hours);
	this.hoursSpent=hoursSpent;
	this.hoursDiff=this.hoursSpent-this.hours;
}
TaskFinished.prototype=Object.create(Task.prototype);
TaskFinished.prototype.constructor=TaskFinished;

var tasksNotStarted=[];
var tasksStarted=[];
var tasksFinished=[];
var firebase="https://myscrumboard.firebaseio.com/";
var taskDragged;

var crud=function(method,data,url,callback){
	var req = new XMLHttpRequest();
	req.open(method, url + '.json', true);
		req.onload = function() {
		if(this.status >= 200 && this.status < 400) {
			var res = JSON.parse(this.response);			
			callback(res);
		}
		else {
			console.error(this.response);
		}
	}
	if(data)
		req.send(JSON.stringify(data));
	else
		req.send();
}

function displayTask(task,col,nTasks){
	var elem=$('.tbody .col-sm-4:nth-child('+col+')');
	var childIndex;
	if(nTasks)
		childIndex=nTasks-1;
	else
	    childIndex=elem.children().get().length;

	var htmlString='<div class="col-sm-2" draggable="true"><div class="description"><span>'+task.description+'</span>&nbsp;<span class="glyphicon glyphicon-pencil" onclick="editTask(this,'+childIndex+','+col+')"></span></div><div class="personName">Assigned to: <span>'+task.personName+'</span></div><div class="hours">Estimated hours: <span>'+task.hours+'</span></div>';
	if(col==2)
		htmlString+='<div class="hoursSpent">Hours spent: <span>'+task.hoursSpent+'</span></div>'+'<div class="progress"><div class="progress-bar progress-bar-striped active percentageCompleted" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+task.percentageCompleted+'%"><span>'+task.percentageCompleted+'<span>%</span></span></div></div>';
	if(col==3)
		htmlString='<div class="col-sm-2" draggable="true"><div class="description"><span>'+task.description+'</span></div><div class="personName">Assigned to: <span>'+task.personName+'</span></div><div class="hours">Estimated hours: <span>'+task.hours+'</span></div><div class="hoursSpent">Total hours spent: <span>'+task.hoursSpent+'</span></div>'+'<div class="hoursDiff">&nbsp;&#8710; <span>'+(task.hoursDiff>0?"+":"")+task.hoursDiff+' hours</span></div>';
	htmlString+='</div>'
	elem.append(htmlString);
	elem.children().last().get(0).addEventListener("dragstart", function(event) {
		taskDragged=this;
	    event.dataTransfer.setData("index", childIndex);
	    event.target.style.opacity = "0.5";
	    event.dataTransfer.setData("col", col);
	});
	elem.get(0).addEventListener("dragend", function(event) {
	    event.target.style.opacity = "1";
	});	
}

function getTasks(queryString){
	function callback(res){
		tasksNotStarted.length=0;tasksStarted.length=0;tasksFinished.length=0;
		$('.tbody .col-sm-4').html("");
		for(var prop in res) {
			var nTasks=0;
			for(var p in res[prop]){
				var task=res[prop][p];
				if(queryString&&!(~task.description.indexOf(queryString)||~task.personName.indexOf(queryString)))
					continue;
				task._id=p;
				var col;
				if(prop=="Not_Started"){
					nTasks++;
					tasksNotStarted.push(task);
					col=1;
				}
				if(prop=="Started"){
					nTasks++;
					tasksStarted.push(task);
					col=2;
				}
				if(prop=="Finished"){
					nTasks++;
					tasksFinished.push(task);	
					col=3;				
				}
				displayTask(task,col,nTasks);
			}
		}
	}
	crud('GET','',firebase,callback);
}

function init(){
	
	$(document).ready(function(){
    	$('[data-toggle="popover"]').popover({
    		html:true,
    		animation:true,
    		title: "Find task by person's name / description's keyword(s)",
    		content: '<input class="form-control" <!--style="width:240px-->" type="text"/><button class="btn btn-info" type="button" onclick="filterTask()"><span class="glyphicon glyphicon-search"></span> Search</button><span onclick="closePopOver()" class="glyphicon glyphicon-remove"></span>'
    	}).on("hide.bs.popover",function(){
    		getTasks();
    	});
	});

	getTasks();

	var t=$('.glyphicon-trash').get(0);
	t.addEventListener("dragover", function(event) {
	    event.preventDefault();
	});
	t.addEventListener("drop",function(e){
		removeTask(e);
	});
	var cols=$('.tbody .col-sm-4').get();
	for(var i=0;i<cols.length;i++){
		cols[i].addEventListener("dragover", function(event) {
	    	event.preventDefault();
		});
		cols[i].addEventListener("drop",(function(j){
				return function(e){
							removeTask(e);
							addTask(j+1);
							}
			})(i));
	}
};

init();

function closePopOver(){
	$("[data-toggle='popover']").popover('hide');
}

function resetModal(){
	$('.modal-title').text("Add a new task"); 
	$('.modal-footer>button:first-child').attr("onclick","addTask()").html("Add");
	if($('.modal-body>select').get(0)){
		$('.modal-body>input:last').remove();$('.modal-body>select').remove();$('.modal-body>input:last').css("display","initial");
		$('.modal-body>label:last').remove();$('.modal-body>label:last').remove();$('.modal-body>label:last').css("display","initial");
	}
	var inputFields=$('.form-control').get();
	inputFields[0].value='';inputFields[1].value='';inputFields[2].value='';
	$('#myModal').modal('toggle');
}

//only close modal when clicking on close button or outside the modal
(function(){
	$('#myModal').click(function(e){
		if(e.target!=this)
			return;		
		resetModal();
	});
})();

function addTask(col){
	var newTask;
	if(!col){ //Add a new task
		var col=1;
		var inputFields=$('.form-control').get();
		newTask=new Task(inputFields[0].value,inputFields[1].value,inputFields[2].value);
		inputFields[0].value='';inputFields[1].value='';inputFields[2].value='';
	}else{ //Move task from one column to another
		var taskDescription=$(taskDragged).find(".description>span").text();
		var taskPersonName=$(taskDragged).find(".personName>span").text();
		var taskHours=$(taskDragged).find(".hours>span").text();
		var taskPercentageCompleted=$(taskDragged).find(".percentageCompleted>span").contents().filter(function(){return this.nodeType==3}).text();
		var taskHoursSpent=$(taskDragged).find(".hoursSpent>span").text();
		if(col==1)
			newTask=new Task(taskDescription,taskPersonName,taskHours);
		if(col==2)
			newTask=new TaskStarted(taskDescription,taskPersonName,taskHours,taskPercentageCompleted||0,taskHoursSpent||0);
		if(col==3)
			newTask=new TaskFinished(taskDescription,taskPersonName,taskHours,taskHoursSpent);
	}
	function callback(response){

		newTask._id = response.name;
		if (col==1){
			tasksNotStarted.push(newTask);
		}
		if (col==2){
			tasksStarted.push(newTask);
		}
		if (col==3){
			tasksFinished.push(newTask);
		}		
		
		displayTask(newTask,col);
	}
	var taskState=(col==1)?"Not_Started":(col==2)?"Started":"Finished";
	crud('POST',newTask,firebase+taskState,callback);	
}

function removeTask(event){
	var i=event.dataTransfer.getData("index");
	var col=event.dataTransfer.getData("col");
	function callback(response){
		if(col==1)
			tasksNotStarted.splice(i,1);
		if(col==2)
			tasksStarted.splice(i,1);
		if(col==3)
			tasksFinished.splice(i,1);
		$('.tbody .col-sm-4:nth-child('+col+')').children(':nth-child('+(parseInt(i)+1)+')').fadeOut(function(){
			$('.tbody .col-sm-4:nth-child('+col+')').children(':nth-child('+(parseInt(i)+1)+')').remove();

			$('.tbody .col-sm-4:nth-child('+col+')').children().each(function(index){
				$(this).find(".description>span").attr("onclick","editTask(this,"+index+","+col+")");
				$(this).get(0).addEventListener("dragstart", function(event) {
			    	event.dataTransfer.setData("index", index);
			    	event.dataTransfer.setData("col", col);
			    	event.target.style.opacity = "0.5";
				});
			});
		});

	}
	switch(col){
		case "1": crud('DELETE','',firebase+"Not_Started/"+tasksNotStarted[i]._id+'/',callback); break;
		case "2": crud('DELETE','',firebase+"Started/"+tasksStarted[i]._id+'/',callback); break;
		case "3": crud('DELETE','',firebase+"Finished/"+tasksFinished[i]._id+'/',callback); break;
	}
}

function editTask(task,index,col){

	//change add modal to edit modal when clicking on the pencil on the task
	if((btn=$('.modal-footer>button:first-child')).filter('[onclick*="editTask"]').get().length==0){
	
		var taskDescription=$(task).parent().get(0).firstChild.innerHTML;
		var taskPersonName=$(task).parent().next().children().first().get(0).innerHTML;
		var taskHours=$(task).parent().nextAll().eq(1).children().first().get(0).innerHTML;		

		$('.modal-title').text("Edit task");
		btn.attr("onclick","editTask('',"+index+","+col+")").html("Edit");

		$('.modal-body>textarea').val(taskDescription);
		$('.modal-body>input:first').val(taskPersonName);
		$('.modal-body>input:eq(1)').val(taskHours);

		if(col==2){
			var taskHoursSpent=$(task).parent().nextAll().eq(2).children().first().get(0).innerHTML;	
			var taskPercentageCompleted=$(task).parent().nextAll().last().children().first().children().first().contents().first().get(0).nodeValue;	
			$('.modal-body>input:last').css("display","none");
			$('.modal-body>label:eq(2)').css("display","none");
			$('.modal-body').append('<label for="hoursSpent">Hours spent working on the task:</label><input type="text" placeholder="Hours spent..." id="hoursSpent" class="form-control"/>');
			$('.modal-body').append('<label for="sel1">Select % completed:</label><select class="form-control" id="sel1"><option>10</option><option>20</option><option>30</option><option>40</option><option>50</option><option>60</option><option>70</option><option>80</option><option>90</option><option>100</option></select>');
			$('.modal-body>input:eq(2)').val(taskHoursSpent);
			$('.modal-body>select').val(taskPercentageCompleted);
		}

		$('#myModal').modal('toggle');
	//save changes when clicking on edit on the modal
	}else{
		var target=$('.tbody>.col-sm-4:eq('+(col-1)+')>:eq('+index+')');
		var taskDescription=target.find(".description>span").get(0);
		var taskPersonName=target.find(".personName>span").get(0);
		var taskHours=target.find(".hours>span").get(0);

		var inputFields=$('.form-control').get();
		var description=inputFields[0].value; var personName=inputFields[1].value; var hours=inputFields[2].value;
		
		var newTask;
		if(col==1)
			newTask=new Task(description,personName,hours);
		if(col==2){
			var taskPercentageCompleted=target.find(".percentageCompleted>span").get(0);
			var taskPercentageCompletedDiv=target.find(".percentageCompleted");
			var taskHoursSpent=target.find(".hoursSpent>span").get(0);
			var hoursSpent=inputFields[3].value;var percentageCompleted=inputFields[4].value;
			newTask=new TaskStarted(description,personName,hours,percentageCompleted,hoursSpent);
		}
		resetModal();

		function callback(response){
			if(col==1){
				tasksNotStarted[index].description=taskDescription.innerHTML=description;
				tasksNotStarted[index].personName=taskPersonName.innerHTML=personName;
				tasksNotStarted[index].hours=taskHours.innerHTML=hours;	
			}
			if(col==2){
				tasksStarted[index].description=taskDescription.innerHTML=description;
				tasksStarted[index].personName=taskPersonName.innerHTML=personName;
				tasksStarted[index].hours=taskHours.innerHTML=hours;
				tasksStarted[index].percentageCompleted=percentageCompleted;
				taskPercentageCompleted.childNodes[0].nodeValue=percentageCompleted;
				taskPercentageCompletedDiv.css("width",percentageCompleted+"%");
				tasksStarted[index].hoursSpent=taskHoursSpent.innerHTML=hoursSpent;
			}
		}
		switch(col){
			case 1: crud('PUT',newTask,firebase+"Not_Started/"+tasksNotStarted[index]._id+'/',callback); break;
			case 2: crud('PUT',newTask,firebase+"Started/"+tasksStarted[index]._id+'/',callback); break;
		}
	}
	
}

function filterTask(){
	getTasks($('.popover-content>input').val());
}