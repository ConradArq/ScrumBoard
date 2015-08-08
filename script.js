var Task=function(description,personName,hours){
	this.description=description;
	this.personName=personName;
	this.hours=hours;
}
var TaskStarted=function(description,personName,hours,percentageCompleted,hoursSpent){
	Task.call(this,description,personName,hours);
	this.percentageCompleted=percentageCompleted;
	this.hoursSpent=hoursSpent;
	this.getDiff=function(){
		return hours-hoursSpent;
	}
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
		htmlString+='<div class="hoursSpend"><span>'+task.hoursSpent+'</span></div>'+'<div class="progressionBar"><span>'+task.percentageCompleted+'</span></div>';
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
	if(!col){
		var col=1;
		var inputFields=$('.form-control').get();
		newTask=new Task(inputFields[0].value,inputFields[1].value,inputFields[2].value);
		inputFields[0].value='';inputFields[1].value='';inputFields[2].value='';
	}else{
		var taskDescription=$(taskDragged).find(".description>span").text();
		var taskPersonName=$(taskDragged).find(".personName>span").text();
		var taskHours=$(taskDragged).find(".hours>span").text();
		if(col==2)
			newTask=new TaskStarted(taskDescription,taskPersonName,taskHours,0,0);
		else
			newTask=new Task(taskDescription,taskPersonName,taskHours);
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
	console.log(i);
	console.log(tasksStarted);
	switch(col){
		case "1": crud('DELETE','',firebase+"Not_Started/"+tasksNotStarted[i]._id+'/',callback); break;
		case "2": crud('DELETE','',firebase+"Started/"+tasksStarted[i]._id+'/',callback); break;
		case "3": crud('DELETE','',firebase+"Finished/"+tasksFinished[i]._id+'/',callback); break;
	}
}

function editTask(task,index,col){

	if((btn=$('.modal-footer>button:first-child')).filter('[onclick*="editTask"]').get().length==0){
	
		var taskDescription=$(task).parent().get(0).firstChild.innerHTML;
		var taskPersonName=$(task).parent().next().children().first().get(0).innerHTML;
		var taskHours=$(task).parent().nextAll().eq(1).children().first().get(0).innerHTML;		

		$('.modal-title').text("Edit task");
		btn.attr("onclick","editTask('',"+index+","+col+")").html("Edit");

		$('.modal-body>textarea').val(taskDescription);
		$('.modal-body>input:first').val(taskPersonName);
		$('.modal-body>input:last').val(taskHours);

		$('#myModal').modal('toggle');

	}else{
		var target=$('.tbody>.col-sm-4:eq('+(col-1)+')>:eq('+index+')');
		var taskDescription=target.find(".description>span").get(0);
		var taskPersonName=target.find(".personName>span").get(0);
		var taskHours=target.find(".hours>span").get(0);

		var inputFields=$('.form-control').get();
		var description=inputFields[0].value; var personName=inputFields[1].value; var hours=inputFields[2].value;
		var newTask=new Task(description,personName,hours);

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
			}
			if(col==3){
				tasksFinished[index].description=taskDescription.textContent=description;
				tasksFinished[index].personName=taskPersonName.textContent=personName;
				tasksFinished[index].hours=taskHours.textContent=hours;
			}
		}
		switch(col){
			case 1: crud('PUT',newTask,firebase+"Not_Started/"+tasksNotStarted[index]._id+'/',callback); break;
			case 2: crud('PUT',newTask,firebase+"Started/"+tasksStarted[index]._id+'/',callback); break;
			case 3: crud('PUT',newTask,firebase+"Finished/"+tasksFinished[index]._id+'/',callback); break;
		}
	}
	
}

function filterTask(){
	
}