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
    app.use(express.static(__dirname + '/node_modules'));
	app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());

	var extras = [
		{text:"uid", des:"User ID"}, 
		{text: "fbid", des:"Feedback ID"},
		{text:"pmid", des:"Payment ID"},
		{text:"date", des:"Date"},
		{text:"reason", des:"Reason"},
		]; //extra features for template
	
	var countryMail = [
		{code: "DE", country: "Germany/Africa", mail: "accounting.lufthansa-germany@icat.dlh.de"},
		{code: "UK", country: "Europe/Israel", mail: "Accounting.lufthansa@icat.dlh.de"},
	];
	// define model =================
	var taskSchema = new Schema(
	{	
		name: { type: String, required: [true, 'Missing task name'] },
		description: String,
		extras: [],
		template: String
		
	});
	var Task = mongoose.model('Task',taskSchema);
	
	var topicSchema = new Schema(
	{	
		name: { type: String, required: [true, 'Missing topic name'] },
		description: String,
		tasks: [taskSchema]
	})
	
	var Topic = mongoose.model('Topic',topicSchema);
	
    var projectSchema = new Schema(
	{	
		name: { type: String, required: [true, 'Missing project name'] },
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
	
	app.get('/api/extras', function(req, res) {		
		res.json(extras)
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
			if (proj.topics[i].name = name) return proj.topics[i];	
		}
		return null;
	}
	
	
	function isEmpty(objectInput) {
		for ( name in objectInput) {
			return false;
		}
		return true;
	}
	
	app.post('/api/email', function(req,res) {
		var code = req.body.code.slice(0,2);
		for(i = 0; i < countryMail.length; i++)
			if(countryMail[i].code == code) { res.send("Please forward this email to " + countryMail[i].mail); return; }
		res.send("Cannot find email according to this code");
	})
    // create project
    app.post('/api/add', function(req, res) {
        // Find project, create new if not exist
		// Find topic, create new if not exist
		// Find task, create new if not exist
		var data = req.body;
		var msg = "";
		console.log(data);
		var update = {name : data.proj.name};
		var query = data.proj._id ? {_id: data.proj._id} : {_id:  new ObjectId()};
		var options = { upsert: true, new: true, setDefaultsOnInsert: true };
		Project.findOneAndUpdate(query, update, options, function(err, doc){
			if (err) {console.log(err); return;}
			
			if(isEmpty(data.task) && isEmpty(data.topic)) { msg = "Project upsert successfully"; return; }
			
			if(!isEmpty(data.topic)){ //If upsert topic
				var newtopic = new Topic({
					_id: new ObjectId(),
					name: data.topic.name,
					//description: data.topic.description,
					tasks: []
				})
			}
			
			if(!isEmpty(data.task)){ // If upsert task
				var newtask = new Task({
					_id: new ObjectId(),
					name: data.task.name,
					//description: data.task.description,
					extras: data.task.extras,
					template: data.task.template
				})
			}
			
			if(!isEmpty(data.topic) && !isEmpty(data.task)) newtopic.tasks.push(newtask);// If both upsert both topic and task				
			
			if(!isEmpty(data.topic) || !isEmpty(data.task)){
				Project.updateOne(
					{_id: doc._id, "topics._id" : { $ne: data.topic._id }},
					{$push : { topics : newtopic }},
					function(err,affected){
						if(err) console.log(err);
						console.log(affected);
						if(affected.nModified === 0){ //If topic exist
							update = {$set : { 'topics.$.name' : data.topic.name}};
							query = {_id: doc._id, "topics._id" : data.topic._id};
							if(!isEmpty(data.task)) { // If upsert task
								update["$push"] = { 'topics.$.tasks': newtask};
								query["topics.tasks._id"] = { $ne: data.task._id };
							}
							Project.updateOne(
								//{_id: doc._id, "topics._id" : data.topic._id, "topics.tasks._id" : { $ne: data.task._id }},
								//{$set : { 'topics.$.name' : data.topic.name, 'topics.$.description' : data.topic.description},
								// $push: { 'topics.$.tasks': newtask}
								//},
								query,update,
								function(e,a){
									if(e) console.log(e);
									if(isEmpty(data.task)) { msg = "Topic upsert successfully"; return; }
									if(a.nModified === 0){ // If task exist
										console.log("Task exist");
										var temptopic = doc.topics.id(data.topic._id);
										var temptask = temptopic.tasks.id(data.task._id);
										temptopic.name = data.topic.name;
										temptask.name = data.task.name;
										temptask.template = data.task.template;
										temptask.extras = data.task.extras;
										msg = "Task update successfully";
										doc.save();
										
									}
									else msg = "Task insert successfully";
									console.log(a);
								}
							);
						}
						else{
							if(isEmpty(data.task)) msg = "Topic upsert successfully";
							else msg = "Task upsert successfully";
						}
						Project.find(function(err, projs) {
							if (err)
								res.send(err)
							result = {"projs" : projs, "msg" : msg};
							res.json(result); // return all todos in JSON format
						});
					}
				);
			}
		});
		
		/*
		switch(data.addType){	
			case "project":
				var data = req.body;
				var update = {name : data.proj.name, description: data.proj.description};
				var query = data.proj._id ? {_id: data.proj._id} : {_id:  new ObjectId()};
				var options = { upsert: true, new: true, setDefaultsOnInsert: true };
				Project.findOneAndUpdate(query, update, options, function(err, doc){
					if (err) {console.log(err); return err;}
					else res.send("Project is created successfully");
				})
				break;
			case "topic":
				Project.findOneAndUpdate(query, update, options, function(err, doc){
					if (err) {console.log(err); return;}
					
					var newtopic = new Topic({
						_id: new ObjectId(),
						name: data.topic.name,
						description: data.topic.description,
						tasks: []
					})

					Project.update(
						{_id: doc._id, "topics._id" : { $ne: data.topic._id }},
						{$push : { topics : newtopic }},
						function(err,affected){
							if(err) console.log(err);
							console.log(affected);
							if(affected.nModified === 0){
								Project.update(
									{_id: doc._id, "topics._id" : data.topic._id },
									{$set : { 'topics.$.name' : data.topic.name, 'topics.$.description' : data.topic.description}},
									function(e,a){
										if(e) console.log(e);
										console.log(a);
									}
								);
							}
						}
					);
				});	
				res.send("Topic is created successfully");
				break;				
			case "task":
				Project.findOneAndUpdate(query, update, options, function(err, doc){
					if (err) {console.log(err); return;}
					
					var newtopic = new Topic({
						_id: new ObjectId(),
						name: data.topic.name,
						description: data.topic.description,
						tasks: []
					})
					
					var newtask = new Task({
						_id: new ObjectId(),
						name: data.task.name,
						description: data.task.description,
						idrequired: true,
						template: data.template
					})
					newtopic.tasks.push(newtask);					
					Project.updateOne(
						{_id: doc._id, "topics._id" : { $ne: data.topic._id }},
						{$push : { topics : newtopic }},
						function(err,affected){
							if(err) console.log(err);
							console.log(affected);
							if(affected.nModified === 0){
								Project.updateOne(
									{_id: doc._id, "topics._id" : data.topic._id, "topics.tasks._id" : { $ne: data.task._id }},
									{$set : { 'topics.$.name' : data.topic.name, 'topics.$.description' : data.topic.description},
									 $push: { 'topics.$.tasks': newtopic}
									},
									function(e,a){
										if(e) console.log(e);
										if(a.nModified === 0){
											Project.updateOne(
												{_id: doc._id, "topics._id" : data.topic._id, "topics.tasks._id" : data.task._id},
												{$set : { 'topics.$.name' : data.topic.name, 'topics.$.description' : data.topic.description,
												'topics.$.tasks.$[task].name': data.task.name, 'topics.$.tasks.$[task].description': data.task.description, 'topics.$.tasks.$[task].template' : data.template}},
												{ arrayFilters: [{ 'task._id': data.task._id }] },
												function(e1,a1){
													if(e1) console.log(e1);
													console.log(a1);
												})
										}
										console.log(a);
									}
								);
							}
						}
					);
				});
				res.send("Task is created successfully");
				break;
		}*/		
    });
	
	// create topics
    app.post('/api/topics', function(req, res) {
        var newtopic = new Topic({
			name: req.body.title,
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
			name: req.body.title,
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