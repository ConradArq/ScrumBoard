var Task=function(description,personName,hours,state){
	this.description=description;
	this.personName=personName;
	this.hours=hours;
}
var tasksNotStarted=[];
var tasksStarted=[];
var tasksFinished=[];
var firebase="https://myscrumboard.firebaseio.com/";

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

	var htmlString='<div class="col-sm-2" draggable="true"><div class="description">'+task.description+' <span class="glyphicon glyphicon-pencil" onclick="editTask(this,'+childIndex+','+col+')"></span></div><div class="personName">Assigned to: <span>'+task.personName+'</span></div><div class="hours">Estimated hours: <span>'+task.hours+'</span></div></div>';
	elem.append(htmlString);
	elem.children().last().get(0).addEventListener("dragstart", function(event) {
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

(function init(){
	getTasks();
	var elem=$('.tbody .col-sm-4');
		for (var i = 0; i < elem.length; i++) {
			var children=elem.children();
			for (var j = 0; j < children.length; j++) {
				children.get(j).addEventListener("dragstart", function(event) {
			    	event.dataTransfer.setData("index", j);
			    	event.dataTransfer.setData("col", i+1);
			    	event.target.style.opacity = "0.5";
				});
				children.get(0).addEventListener("dragend", function(event) {
			    	event.target.style.opacity = "1";
				});
			};
		};

	var t=$('.glyphicon-trash').get(0);
	t.addEventListener("dragover", function(event) {
	    event.preventDefault();
	});
	t.addEventListener("drop",function(e){
		removeTask(e);
	});
})();

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

function addTask(){
	var inputFields=$('.form-control').get();
	var newTask=new Task(inputFields[0].value,inputFields[1].value,inputFields[2].value,"notStarted");
	inputFields[0].value='';inputFields[1].value='';inputFields[2].value='';

	function callback(response){

		newTask._id = response.name;
		tasksNotStarted.push(newTask);
		displayTask(newTask,1);
	}

	crud('POST',newTask,firebase+'Not_Started',callback);	
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
		var elem=$('.tbody .col-sm-4:nth-child('+col+')').children(':nth-child('+(parseInt(i)+1)+')').remove();
	}

	switch(col){
		case "1": crud('DELETE','',firebase+"Not_Started/"+tasksNotStarted[i]._id+'/',callback); break;
		case "2": crud('DELETE','',firebase+"Started/"+tasksStarted[i]._id+'/',callback); break;
		case "3": crud('DELETE','',firebase+"Finished/"+tasksFinished[i]._id+'/',callback); break;
	}
}

function editTask(task,index,col,desc,pers,hours){

	if((btn=$('.modal-footer>button:first-child')).filter('[onclick*="editTask"]').get().length==0){

		var taskDescription=$(task).parent().get(0).firstChild;
		var taskPersonName=$(task).parent().next().children().first().get(0);
		var taskHours=$(task).parent().nextAll().eq(1).children().first().get(0);
		console.log(taskDescription.nodeValue);
		$('.modal-title').text("Edit task");
		btn.attr("onclick","editTask(null,"+index+","+col+","+(taskDescription.nodeValue||null)+","
			+(taskPersonName.innerHTML||null)+","+(taskHours.innerHTML||null)+")").html("Edit");

		$('#myModal').modal('toggle');
		console.log($('.modal-body>textarea'));
		$('.modal-body>textarea').html(taskDescription.nodeValue);
		$('.modal-body>input:first').val(taskPersonName.innerHTML);
		$('.modal-body>input:last').val(taskHours.innerHTML);

	}else{
		resetModal();
		var inputFields=$('.form-control').get();
		var description=inputFields[0].value; var personName=inputFields[1].value; var hours=inputFields[2].value;
		var newTask=new Task(description,personName,hours);
		function callback(response){
			if(col==1){
				tasksNotStarted[index].description=desc=description;
				tasksNotStarted[index].personName=pers=personName;
				tasksNotStarted[index].hours=hours=hours;	
			}
			if(col==2){
				tasksStarted[index].description=description;
				tasksStarted[index].personName=personName;
				tasksStarted[index].hours=hours;
			}
			if(col==3){
				tasksFinished[index].description=description;
				tasksFinished[index].personName=personName;
				tasksFinished[index].hours=hours;
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