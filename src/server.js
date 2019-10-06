// server.js

    // set up ========================
	const request = require('request');
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    var mongoose = require('mongoose');                     // mongoose for mongodb
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
	var cron = require('node-cron'); // task-scheduler 
	const fs = require('fs'); // fileWriter
	var models = require('./models');				// get models from models.js
    var ObjectId = mongoose.Types.ObjectId;
	// configuration =================
	mongoose.connect('mongodb://mongo:27017/mydb', {useNewUrlParser: true, keepAlive: true});
    //mongoose.connect('mongodb://127.0.0.1/mydb', {useNewUrlParser: true});     // connect to mongoDB database on modulus.io
	//Ép Mongoose sử dụng thư viện promise toàn cục
	mongoose.Promise = global.Promise;
	
	var db = mongoose.connection;
	//Ràng buộc kết nối với sự kiện lỗi (để lấy ra thông báo khi có lỗi)
	db.on('error', console.error.bind(console, 'MongoDB connection error:'));
	db.on('open', function (ref) {
    //trying to get collection names
		db.db.listCollections().toArray(function (err, names) {
			console.log(names); // [{ name: 'dbname.myCollection' }]
		});
	})
    app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    //app.use('/scripts', express.static(path.join(__dirname,'node_modules')));			// set the static files location to get javascript package
	app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());
	//console.log(Buffer.from('D1234:D1234').toString('base64'))
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
	/*app.get('/api/topics', function(req, res) {
		models.Project.findById(req.query.projectId, function(err, proj) {
			if (err)
				res.send(err)
			res.json(proj.topics);
        });
	});*/
	
	// This API handle GET request to get task by projectID and topicID
	/*app.get('/api/tasks', function(req, res) {
		models.Project.findById(req.query.projectId, function(err, proj) {
			if (err)
				res.send(err)
			res.json(proj.topics.id(req.query.topicId).tasks);
        });
	});*/
	
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
		/*var data = req.body;
		var msg = [];
		upsertProject(data.proj, msg)
		.then(p => {
			console('Returned from upsert Project');
			console.log(p);
			return upsertTopic(p,data.proj.topic, msg)
			//return getProjects();
			//else return p;
		})
		//.then(function(t) { 
		//	if(data.proj.topic && data.proj.topic.task) upsertTask(t,data.proj.topic.task)
		//	else return t;
		//})
		.then(r => {
			console.log('Returned from upsert topic');
			console.log(r);
			return getProjects();
			//res.json({"projs": r, "msg": msg});
		})
		.then(p => res.json({"projs": p, "msg": msg}))		
		.catch(err => function(err){console.log(err)});
		*/
		var msg = [];
		var proj = req.body.proj;
		var topic = req.body.proj.topic;
		var task = topic ? req.body.proj.topic.task : null;
		var update = {name : proj.name};
		var query = proj._id ? {_id: proj._id} : {_id: new ObjectId()};
		var option = { upsert: true, new: true, setDefaultsOnInsert: true };
		models.Project.findOneAndUpdate(query,update,option,function(err,doc){ // Upsert project
			if (err) msg.push(err);
			if (proj._id) msg.push("Project update successfully")
			else msg.push("Project create successfully")
			return doc;
		}).exec()
		.catch(err => function(err){msg.push("Error: " + err); res.send({"msg" : msg})})
		.then( doc => { // Upsert topic
			//console.log(doc);
			if (topic && topic._id) {
				var query = {'_id' : doc._id, 'topics._id' : topic._id }
				var update = {'topics.$.name': topic.name}
				doc.topics.id(topic._id).name = topic.name;
				msg.push("Topic update successfully")
			}
			else if (topic) {
				console.log(doc);
				var new_topic = new models.Topic({
					_id: new ObjectId(),
					name: topic.name,
					tasks: []
				})
				var query = {'_id': doc._id }
				var update = { '$push' : new_topic }
				doc.topics.push(new_topic);
				msg.push("Topic create successfully")
			}			
			return doc.save();
		})
		.catch(err => function(err){msg.push("Error: " + err); res.send({"msg" : msg})})
		.then ( doc => { // Upsert task
			if(task && task._id) {
				var my_task = doc.topics.id(topic._id).tasks.id(task._id);
				var is_replace = my_task.name == task.name && my_task.template == task.template && my_task.extras.sort() == task.extras.sort()
				if (!is_replace) {
					my_task.name = task.name
					my_task.template = task.template;
					my_task.extras = task.extras;
					msg.push("Task update successfully");
				};				
			}
			else if (task) {
				var new_task = new models.Task({name: task.name, extras: task.extras});
				doc.topics.id(topic._id).tasks.push(new_task);
				msg.push("Task create successfully");				
			}
			return doc.save();
		})
		.catch(err => function(err){msg.push("Error: " + err); res.send({"msg" : msg})})
		.then( r => { // Return updated projects
			return getProjects();
		})
		.catch(err => function(err){msg.push("Error: " + err); res.send({"msg" : msg})})
		.then(p => res.json({"projs": p, "msg": msg}))	
		.catch(err => function(err){console.log(err)});
    });
	
	app.get('/favicon.ico', (req, res) => res.sendStatus(204));	
	
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
	
	/* app.post('/api/jira/comment', function(req, res) {
		// Decode base64 login info
		let auth = Buffer.from(req.body.auth, 'base64').toString('binary').split(':');
		console.log(auth);
		var option = {
			url: 'http://192.168.1.106:8080' + req.body.url,
			headers: {
				'Content-Type': 'application/json',
			},
			'auth': {
				'user': auth[0], 
				'pass': auth[1]'
			},
			body: JSON.stringify({ 'body': req.body.comment })
		}
		request.post(option, function(_error,_res,_body) {
			if(_error) {
				console.log(_error)
				res.send({statusCode: _res.statusCode});
			}
			console.log(_res.statusCode);
			_body['statusCode'] = _res.statusCode;
			console.log(_body)
			res.send(_body)
		})		
	}); */
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
		return await models.Project.find(function(err, projs) {
            if (err) console.log(err);
            return projs;
        });
	}
	
	// Check if object is empty, like {} or [] or null or undefined
	function isEmpty(objectInput) {
		for ( name in objectInput) {
			return false;
		}
		return true;
	}
	
	// Set up task scheduler to backup data every midnight
	cron.schedule('0 0 0 * * *', () => {
		console.log('running backup every midnight');
		getProjects().then(p => {
			let data = JSON.stringify(p);
			fs.writeFile('/usr/src/app/data/project.json', data, (err) => {
				if (err) throw err;
				console.log('Backup successfully');
			});
		});
	});
	// Insert or update project
	/* async function upsertProject(proj, m){
		var update = {name : proj.name};
		var query = proj._id ? {_id: proj._id} : {_id: new ObjectId()};
		var option = { upsert: true, new: true, setDefaultsOnInsert: true };
		return await models.Project.findOneAndUpdate(query,update,option,function(err,doc){
			if (err) m.push(err);
			if (proj._id) m.push("Project update successfully")
			else m.push("Project create successfully")
			return doc;
		}).exec();
	} */
	
	// Insert of update topic
	/*async function upsertTopic(doc,topic,m){
		
		//if(isEmpty(topic)) return r; // If only upsert project
		if (topic._id) {
			var query = {'_id' : doc._id, 'topics._id' : topic._id }
			var update = {'topics.$.name': topic.name}
			doc.topics.id(topic._id).name = topic.name;
		}
		else {
			var new_topic = new models.Topic({
				_id: new ObjectId(),
				name: topic.name,
				tasks: []
			})
			var query = {'_id': doc._id }
			var update = { '$push' : new_topic }
			doc.topics.push(new_topic);
		}
		return doc.save().exec();
		//return await models.Project.findOneAndUpdate(option, update, function (err, _doc) {
		//	if(err) m.push(err);
		//	if(topic._id) m.push("Topic update successfully");
		//	else m.push("Topic create successfully");
		//	return _doc;
		//}).exec();
		var result;
		for(i = 0, ts = doc.topics; i < ts.length; i++){
			if (ts[i]._id == topic._id || ts[i].name == topic.name){ // If topic exist with same ID or same name
				//update topic here
				ts[i].name = topic.name;
				result = ts[i];
				break;
			}
		}
		
		if(result===undefined){ // If topic not exist, insert new topic
			var newtopic = new models.Topic({
				_id: new ObjectId(),
				name: topic.name,
				tasks: []
			})
			doc.topics.push(newtopic);
			result = newtopic;
		}
		await doc.save(); // save changes
		if(topic._id) m.push("Topic update successfully");
		else m.push("Topic create successfully");
		return doc;
	}*/
	
	// Insert or update a task, given that project ID and topic ID are known
	/*async function upsertTask(my_project, task, msg){
		/*if(isEmpty(task)) return r; // If only upsert topic
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
			var newtask = new models.Task({
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
		let p = await models.Project.find(my_project.project_id, function (err, doc){
			if(task._id) {
				var my_task = doc.topics.id(my_project.topic_id).tasks.id(task._id);
				var is_replace = my_task.name == task.name && my_task.template == task.template && my_task.extras.sort() == task.extras.sort()
				if (!is_replace) {
					my_task.name = task.name
					my_task.template = task.template;
					my_task.extras = task.extras;
					msg.push("Task update successfully");
					doc.save();
				};				
				return {project_id : my_project.project_id , topic_id: my_project.topic_id, task_id: task._id};
			}
			else {
				var new_task = new models.Task({name: task.name, template: task.template, extras: task.extras});
				doc.topics.id(my_project.topic_id).tasks.push(new_topic);
				msg.push("Task create successfully");
				new_task.save(function(err, _t){ 
					return {project_id : my_project.project_id , topic_id: my_project.topic_id, task_id: _t._id};
				});				
			}
		});
		return p;
	}*/
	
	// application -------------------------------------------------------------
    app.get('*', function(req, res) {
        res.sendFile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
	
	const PORT = 8888;
	// listen (start app with node server.js) ======================================
    app.listen(PORT,function(){
		 console.log('Your node js server is running on PORT:',PORT);
	});
   