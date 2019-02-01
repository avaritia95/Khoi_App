// server.js

    // set up ========================
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    var mongoose = require('mongoose');                     // mongoose for mongodb
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
	
	Schema = mongoose.Schema;
    // configuration =================

    mongoose.connect('mongodb://127.0.0.1/mydb');     // connect to mongoDB database on modulus.io
	//Ép Mongoose sử dụng thư viện promise toàn cục
	mongoose.Promise = global.Promise;
	//Lấy kết nối mặc định
	var db = mongoose.connection;

	//Ràng buộc kết nối với sự kiện lỗi (để lấy ra thông báo khi có lỗi)
	db.on('error', console.error.bind(console, 'MongoDB connection error:'));
	
    app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());

	var projects = [{"id":"0", "text":"A"}, {"id":"1", "text":"B"}, {"id":"2", "text":"C"}, {"id":"3", "text":"D"}]
	let topics = [];
	let tasks = [];
	
	// define model =================
	var taskSchema = new Schema(
	{	
		taskName: { type: String, required: [true, 'Missing task name'] },
		description: String,
		idrequired: Boolean,
		
	});
	var Task = mongoose.model('Task',taskSchema);
	
	var topicSchema = new Schema(
	{	
		topicName: { type: String, required: [true, 'Missing topic name'] },
		description: String,
		tasks: [taskSchema]
	})
	
	var Topic = mongoose.model('Topic',topicSchema);
	
    var projectSchema = new Schema(
	{	
		projectName: { type: String, required: [true, 'Missing project name'] },
		description: String,
		topics: [topicSchema]
	})
	var Project = mongoose.model('Project',projectSchema);
	
	async function createProject(projectname,des){
		var newproject = new Project({
			projectName: projectname,
			description: des
		})
		var result = await newproject.save();
		console.log(result);
	}
	
	async function createTopic(projectname,topicname,des){
		
		var newtopic = new Topic({
			topicName: topicname,
			description: des
		})
		Project.findOneAndUpdate({projectName: projectname}, {$push: {topics: newtopic}});
		var result = await project.save();
		console.log(result);
	}
	
	async function createTask(topicname,taskname,des,req){
		var newtask = new Task({
			taskName: taskname,
			description: des,
			idrequired: req
		})
		Topic.findOneAndUpdate({topicName: topicname}, {$push: {tasks: newtask}});
		var result1 = await topic.save();
		var result2 = await project.save();
		console.log(result);
	}

	// routes ======================================================================

    // api ---------------------------------------------------------------------
    // get all todos
    app.get('/api/todos', function(req, res) {
		
		/*
        // use mongoose to get all todos in the database
        Todo.find(function(err, todos) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(todos); // return all todos in JSON format
        });
		*/
		res.json(projects)
    });
	
	app.get('/api/topics', function(req, res) {
		for(var i = 0; i < projects.length; i++){
			topics.push({"id": i, "text": projects[req.query.project_id].text + projects[i].text}); 
		}
		res.json(topics);
	});
	
	app.get('/api/tasks', function(req, res) {
		for(var i = 0; i < projects.length; i++){
			tasks.push({"id": i, "text": topics[req.query.topic_id].text + projects[i].text}); 
		}
		res.json(tasks);
	});
	
    // create todo and send back all todos after creation
    app.post('/api/todos', function(req, res) {

        // create a todo, information comes from AJAX request from Angular
        /*
		Todo.create({
            text : req.body.text,
            done : false
        }, function(err, todo) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            Todo.find(function(err, todos) {
                if (err)
                    res.send(err)
                res.json(todos);
            });
        });
		*/
		res.json('post success:' + req.body.text);
    });

    // delete a todo
    app.delete('/api/todos/:todo_id', function(req, res) {
        Todo.remove({
            _id : req.params.todo_id
        }, function(err, todo) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            Todo.find(function(err, todos) {
                if (err)
                    res.send(err)
                res.json(todos);
            });
        });
    });
	
	// application -------------------------------------------------------------
    app.get('*', function(req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
	
	// listen (start app with node server.js) ======================================
    app.listen(8080);
    console.log("App listening on port 8080");