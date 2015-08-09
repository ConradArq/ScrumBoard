var Task=function(description,personName,hours){
	this.description=description;
	this.personName=personName;
	this.hours=hours;
}
var TaskStarted=function(description,personName,hours,percentageCompleted,hoursSpent){
	Task.call(this,description,personName,hours);
	this.percentageCompleted=percentageCompleted;
	this.hoursSpent=hoursSpent;
}
var TaskFinished=function(description,personName,hours,hoursSpent){
	Task.call(this,description,personName,hours);
	this.hoursSpent=hoursSpent;
	this.hoursDiff=this.hours-this.hoursSpent;
}
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

	var htmlString='<div class="col-sm-2" draggable="true"><div class="description"><span>'+task.description+' </span><span class="glyphicon glyphicon-pencil" onclick="editTask(this,'+childIndex+','+col+')"></span></div><div class="personName">Assigned to: <span>'+task.personName+'</span></div><div class="hours">Estimated hours: <span>'+task.hours+'</span></div>';
	if(col==2)
		htmlString+='<div class="hoursSpent">Hours spent:<span>'+task.hoursSpent+'</span></div>'+'<div class="progress"><div class="progress-bar progress-bar-striped active percentageCompleted" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+task.percentageCompleted+'%"><span>'+task.percentageCompleted+'%</span></div></div>';
	if(col==3)
		htmlString='<div class="col-sm-2" draggable="true"><div class="description"><span>'+task.description+'</span></div><div class="personName">Assigned to: <span>'+task.personName+'</span></div><div class="hours">Estimated hours: <span>'+task.hours+'</span></div><div class="hoursSpent">Total hours spent:<span>'+task.hoursSpent+'</span></div>'+'<div class="hoursDiff">&#8710; <span>'+task.hoursDiff+' hours</span></div>';
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

function getTasks(){
	function callback(res){
		for(var prop in res) {
			var nTasks=0;
			for(var p in res[prop]){
				var task=res[prop][p];
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

function resetModal(){
	$('.modal-title').text("Add a new task"); 
	$('.modal-footer>button:first-child').attr("onclick","addTask()").html("Add");
	if($('.modal-body>input:nth-child(4)').get(0)){
		$('.modal-body>input:last').remove();$('.modal-body>input:last').remove();$('.modal-body>input:last').css("display","initial");
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
		var taskPercentageCompleted=$(taskDragged).find(".percentageCompleted>span").text();
		var taskHoursSpent=$(taskDragged).find(".hoursSpent>span").text();
		if(col==2)
			newTask=new TaskStarted(taskDescription,taskPersonName,taskHours,taskPercentageCompleted||0,taskHoursSpent||0);
		else
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
		$('.tbody .col-sm-4:nth-child('+col+')').children(':nth-child('+(parseInt(i)+1)+')').remove();

		$('.tbody .col-sm-4:nth-child('+col+')').children().each(function(index){
			$(this).find(".description>span").attr("onclick","editTask(this,"+index+","+col+")");
			$(this).get(0).addEventListener("dragstart", function(event) {
		    	event.dataTransfer.setData("index", index);
		    	event.dataTransfer.setData("col", col);
		    	event.target.style.opacity = "0.5";
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
		$('.modal-body>input:nth-child(2)').val(taskHours);

		if(col==2){
			var taskPercentageCompleted=$(task).parent().nextAll().eq(2).children().first().get(0).innerHTML;	
			var taskHoursSpent=$(task).parent().nextAll().last().children().first().children().first().get(0).innerHTML;	
			$('.modal-body>input:last').css("display","none");
			$('.modal-body').append('<input type="text" placeholder="Hours spent..."class="form-control"/>');
			$('.modal-body').append('<input type="text" placeholder="Percentage completed..."class="form-control"/>');
			$('.modal-body>input:nth-child(3)').val(taskHoursSpent);
			$('.modal-body>input:last').val(taskPercentageCompleted);		
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
			var taskPercentageCompleted=target.find(".hoursSpent>span").get(0);
			var taskHoursSpent=target.find(".progress-bar>span").get(0);
			var percentageCompleted=inputFields[3].value;var hoursSpent=inputFields[4].value;
			newTask=new TaskStarted(description,personName,hours,percentageCompleted,hoursSpent);
		}
		console.log($('.modal-footer>button:first-child').filter('[onclick*="editTask"]').get());
		alert(1);
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
				tasksStarted[index].percentageCompleted=taskPercentageCompleted.innerHTML=percentageCompleted;
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
	
}