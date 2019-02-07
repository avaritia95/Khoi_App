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

    mongoose.connect('mongodb://127.0.0.1/mydb', {useNewUrlParser: true});     // connect to mongoDB database on modulus.io
	//Ép Mongoose sử dụng thư viện promise toàn cục
	mongoose.Promise = global.Promise;
	//Lấy kết nối mặc định
	var db = mongoose.connection;
	var ObjectId = mongoose.Types.ObjectId;
	
	//Ràng buộc kết nối với sự kiện lỗi (để lấy ra thông báo khi có lỗi)
	db.on('error', console.error.bind(console, 'MongoDB connection error:'));
	
    app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());

	
	// define model =================
	var taskSchema = new Schema(
	{	
		taskName: { type: String, required: [true, 'Missing task name'] },
		description: String,
		idrequired: Boolean,
		template: String
		
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
	

	// routes ======================================================================

    // api ---------------------------------------------------------------------
    // get all todos
    app.get('/api/projects', function(req, res) {
		
		
        // use mongoose to get all todos in the database
        Project.find(function(err, projs) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(projs); // return all todos in JSON format
        });
		
		//res.json(projects)
    });
	
	app.get('/api/topics', function(req, res) {
		Project.findById(req.query.projectId, function(err, proj) {
			if (err)
				res.send(err)
			res.json(proj.topics);
        });
	});
	
	app.get('/api/tasks', function(req, res) {
		Project.findById(req.query.projectId, function(err, proj) {
			if (err)
				res.send(err)
			res.json(proj.topics.id(req.query.topicId).tasks);
        });
	});
	
	function findTopic(proj, name){
		for(i in proj.topics){
			if (proj.topics[i].topicName = name) return proj.topics[i];	
		}
		return null;
	}
	
	function createTopic(proj, req){
		var newtopic = new Topic({
			topicName: req.body.topicname,
			description: req.body.topicdes,
			tasks: []
		})
	    proj.topics.push(newtopic);
		
		return proj.topics[proj.topics.length-1];
	}
	
	function findTask(topic, name){
		for(i in topic.tasks){
			if (topic.tasks[i].taskName = name) return topic.tasks[i];	
		}
		return null;
	}
	
	function createTask(topic, req){
		var newtask = new Task({
			taskName: req.body.taskname,
			description: req.body.taskdes,
			idrequired: true,
			template: req.body.template
		})
		topic.tasks.push(newtask);
		return topic.tasks[topic.tasks.length-1];
	}
    // create project
    app.post('/api/add', function(req, res) {
        // Find project, create new if not exist
		// Find topic, create new if not exist
		// Find task, create new if not exist
		var update = {projectName : req.body.projname, description: req.body.projdes};
		var query = {projectName: req.body.projname}; 
		
		var options = { upsert: true, new: true, setDefaultsOnInsert: true };
		
		Project.findOneAndUpdate(query, update, options, function(err, doc){
			if (err) return res.send(500, { error: err });
			switch(req.body.addType){
				case "project": return res.send("Project is created successfully");
				case "topic":
					var topic = findTopic(doc,req.body.topicname);
					if(topic != null) topic.description = req.body.topicdes;
					else{
						var newtopic = new Topic({
							topicName: req.body.topicname,
							description: req.body.topicdes,
							tasks: []
						})
						doc.topics.push(newtopic);
					}
					doc.save(function(err,d){
						if (err) console.log(err);
						console.log(d);
					})	
					//console.log(doc);
					return res.send("Topic is created successfully");
				case "task":
					var topic = findTopic(doc,req.body.topicname);
					if(topic != null){
						var task = findTask(topic, req.body.taskname);
						if ( task != null ) {
							task.description = req.body.taskdes;
							task.template = req.body.template;
						}
						else{
							createTask(topic,req);
						}
					}
					else{
						createTopic(doc,req);
						createTask(newtopic,req);
					}
					return res.send("Task is created successfully");
			}
			
		});
		
		/* Project.create({
            projectName : req.body.projname,
            description : req.body.projdes,
			topics: []
        }, function(err, proj) {
            if (err)
                res.send(err);
			else{
				res.send("Project is created successfully");
			}
            
        }); */
    });
	
	// create topics
    app.post('/api/topics', function(req, res) {
        var newtopic = new Topic({
			topicName: req.body.title,
			description: req.body.des,
			tasks: []
		})
		Project.findOneAndUpdate({_id: req.body.projId}, {
				$push: {topics: newtopic}
			}, {new: true}, function (err, doc) {
				if (err) {
					console.log("Something wrong when updating data!");
				}
				res.json(doc.topics);
			});
    });
	
	// create tasks
	app.post('/api/tasks', function(req, res) {
        
		console.log(req.body.projId);
		console.log(req.body.topicId);
		var newtask = new Task({
			taskName: req.body.title,
			description: req.body.des,
			idrequired: true,
			template: req.body.template
		})
		Project.findOneAndUpdate({_id: req.body.projId, 'topics._id': req.body.topicId}, {
				$push: {'topics.$.tasks': newtask}
			}, {new: true}, function (err, doc) {
				console.log(doc);
				if (err) {
					console.log("Something wrong when updating data!");
				}				
				res.json(doc.topics.id(req.body.topicId).tasks);
			});
    });
	
	app.post('/api/template', function(req, res) {
        
		console.log(req.body.projId);
		console.log(req.body.topicId);
		console.log(req.body.task._id);
		Project.findById(req.body.projId, 
			function (err, doc) {
				console.log(doc.topics);
				if (err) {
					console.log(err);
				}				
				res.json(doc.topics.id(req.body.topicId).tasks.id(req.body.task._id).template);
			});
    });
	
	app.post('/api/clear', function(req,res){
		Project.remove({}, function(err) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            Project.find(function(err, projs) {
                if (err)
                    res.send(err)
                res.json(projs);
            });
        });
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
	
	app.get('/favicon.ico', (req, res) => res.status(204));
	// application -------------------------------------------------------------
    app.get('*', function(req, res) {
        res.sendFile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
	
	// listen (start app with node server.js) ======================================
    app.listen(8080);
    console.log("App listening on port 8080");