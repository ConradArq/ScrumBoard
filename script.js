var Task=function(description,personName,hours){
	this.description=description;
	this.personName=personName;
	this.hours=hours;
}
var tasks=[];


function addTask(){
	var inputFields=$('.form-control').get();
	var newTask=new Task(inputFields[0].value,inputFields[1].value,inputFields[2].value);
	tasks.push(newTask);
	console.log($('.description'));
	$('.description').html(newTask.description);
	$('.personName').html(newTask.personName);
	$('.hours').html(newTask.hours);
}
function removeTask(){
	
}
function filterTask(){
	
}