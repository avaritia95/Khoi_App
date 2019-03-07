// server.js

    // set up ========================
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    var mongoose = require('mongoose');                     // mongoose for mongodb
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
	
	var models = require('./models');				// get models from models.js
    
	// configuration =================
	//mongoose.connect('mongodb://mongo:27017/mydb', {useNewUrlParser: true});
    mongoose.connect('mongodb://127.0.0.1/mydb', {useNewUrlParser: true});     // connect to mongoDB database on modulus.io
	//Ép Mongoose sử dụng thư viện promise toàn cục
	mongoose.Promise = global.Promise;
	
	var db = mongoose.connection;
	//Ràng buộc kết nối với sự kiện lỗi (để lấy ra thông báo khi có lỗi)
	db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    app.use(express.static(__dirname + '/node_modules'));			// set the static files location to get javascript package
	app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());

	// routes ======================================================================

    // API ---------------------------------------------------------------------
    // This API handle GET request to get project list
    app.get('/api/projects', function(req, res) {			
		getProjects().then(p=>res.json(p));
    });
	
	// This API handle GET request to get extra field list
	app.get('/api/extras', function(req, res) {		
		getExtras().then(e=>res.send(e));
    });
	
	// This API handle GET request to get topic by projectID
	app.get('/api/topics', function(req, res) {
		models.Project.findById(req.query.projectId, function(err, proj) {
			if (err)
				res.send(err)
			res.json(proj.topics);
        });
	});
	
	// This API handle GET request to get task by projectID and topicID
	app.get('/api/tasks', function(req, res) {
		models.Project.findById(req.query.projectId, function(err, proj) {
			if (err)
				res.send(err)
			res.json(proj.topics.id(req.query.topicId).tasks);
        });
	});
	
	// This API handle GET request to get mail list by country
	app.get('/api/email', function(req,res) {
		models.Email.find(function(err,m){
			if(err) console.log(err);
			res.send(m);
		});
	})
	
	//This API handle POST request to add extra field and return new list of extra field
	app.post('/api/extras', function(req,res) {
		var tag = req.body.tag;
		var trimtag = tag.toLowerCase().replace(/\s/g,'');
		var options = { upsert: true, new: true, setDefaultsOnInsert: true };
		
		// The text to replaced in template is the trimmed and lowercase version of the extra field
		models.Extra.findOneAndUpdate({text: trimtag},{text: trimtag, des: tag},options,function(err,doc){
			if(err) console.log(err);
			getExtras().then(e => res.send(e));
		});
	})
	
    // This API handle POST request to update,insert of project/topic/task
    app.post('/api/add', function(req, res) {
        // Step 1: upsert project
		// Step 2: upsert topic
		// Step 3: upsert task
		var data = req.body;
		//console.log(data);
		upsertProject(data.proj)
		.then(p => upsertTopic(p,data.topic))
		.then(t => upsertTask(t,data.task))
		.then(function(r){
			//console.log(r);
			getProjects().then(p => res.json({"projs": p, "msg":r.msg}));
		})		
		.catch(err => function(err){console.log(err)});
    });
	
		
	
	// This API handle GET request to get template by projectID and topicID and taskID
	app.post('/api/template', function(req, res) {      
		//console.log(req.body.proj._id);
		//console.log(req.body.topic._id);
		//console.log(req.body.task._id);
		// Use 3 ids to find the correct task with wanted template
		models.Project.findById(req.body.proj._id, 
			function (err, doc) {
				console.log(doc.topics);
				if (err) {
					console.log(err);
				}				
				res.json(doc.topics.id(req.body.topic._id).tasks.id(req.body.task._id).template);
			});
    });
	
	// Clear database - not used
	/*
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
	*/
	
    // delete command - not used
	/*
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
	*/
	
	// HELPER FUNCTION -------------------------------------------------------------
	// Get list of extra fields
	async function getExtras(){
		var extras = await models.Extra.find(function(err, ex) {
            if (err) console.log(err);
            return ex;
        });
		return extras;
	}
	
	// Get list of projects
	async function getProjects(){
		var projects = await models.Project.find(function(err, projs) {
            if (err) console.log(err);
            return projs;
        });
		return projects;
	}
	
	// Check if object is empty, like {} or [] or null or undefined
	function isEmpty(objectInput) {
		for ( name in objectInput) {
			return false;
		}
		return true;
	}
	
	// Insert or update project
	async function upsertProject(proj){
		var update = {name : proj.name};
		var query = {$or: [{_id: proj._id},{name: proj.name}]};
		var options = { upsert: true, new: true, setDefaultsOnInsert: true };
		let p = await models.Project.findOneAndUpdate(query,update,options,function(err,proj){
			if (err) console.log(err);
			return proj;
		})
		return {"proj":p,"msg":"Project upsert successfully"};
	}
	
	// Insert of update topic
	async function upsertTopic(r,topic){
		
		if(isEmpty(topic)) return r; // If only upsert project
		var result;
		for(i = 0, ts = r.proj.topics; i < ts.length; i++){
			if (ts[i]._id == topic._id || ts[i].name == topic.name){ // If topic exist with same ID or same name
				//update topic here
				ts[i].name = topic.name;
				result = ts[i];
				break;
			}
		}
		if(result===undefined){ // If topic not exist, insert new topic
			var newtopic = new Topic({
				_id: new ObjectId(),
				name: topic.name,
				tasks: []
			})
			r.proj.topics.push(newtopic);
			result = newtopic;
		}
		await r.proj.save(); // save changes
		r["topic"] = result; 
		r["msg"] = "Topic upsert successfully";
		return r;
	}
	
	// Insert or update a task, given that project ID and topic ID are known
	async function upsertTask(r,task){
		if(isEmpty(task)) return r; // If only upsert topic
		var result = {};
		for(i = 0, ts = r.proj.topics.id(r.topic._id).tasks; i < ts.length; i++){
			if (ts[i]._id == task._id || ts[i].name == task.name){ // If task exist with same ID or same name
				// Update task here
				ts[i].name = task.name;
				ts[i].template = task.template;
				ts[i].extras = task.extras;
				result = ts[i];
				break;
			}
		}
		if(isEmpty(result)){ // If task not exist, insert new task
			var newtask = new Task({
				_id: new ObjectId(),
				name: task.name,
				extras: task.extras,
				template: task.template
			})
			r.proj.topics.id(r.topic._id).tasks.push(newtask);
			result = newtask;
		}
		await r.proj.save(); // Save changes
		r["task"] = result; 
		r["msg"] = "Task upsert successfully";
		return r;
	}
	
	// application -------------------------------------------------------------
    app.get('*', function(req, res) {
        res.sendFile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
	
	const PORT = 8080;
	// listen (start app with node server.js) ======================================
    app.listen(PORT,function(){
		 console.log('Your node js server is running on PORT:',PORT);
	});
   