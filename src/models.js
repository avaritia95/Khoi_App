var mongoose = require('mongoose');                     // mongoose for mongodb

var Schema = mongoose.Schema;

// define model =================
var taskSchema = new Schema(
{	
	name: { type: String, required: [true, 'Missing task name'] },
	description: String,
	extras: [],
	template: String	
});
var Task = mongoose.model('Task',taskSchema, 'Task');

var topicSchema = new Schema(
{	
	name: { type: String, required: [true, 'Missing topic name'] },
	description: String,
	tasks: [taskSchema]
})

var Topic = mongoose.model('Topic',topicSchema, 'Topic');

var projectSchema = new Schema(
{	
	name: { type: String, required: [true, 'Missing project name'] },
	description: String,
	topics: [topicSchema]
})

var Project = mongoose.model('Project',projectSchema, 'Project');
var Extra = mongoose.model('Extra', new Schema ({text: String, des: String}), 'Extra')
var Email = mongoose.model('Email', new Schema ({code: String, mail: String}), 'Email')

module.exports = {
    Project: Project,
    Topic: Topic,
    Task: Task,
    Extra: Extra,
    Email: Email
};

