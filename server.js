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
	mongoose.connect('mongodb://mongo:27017/mydb', {useNewUrlParser: true});
    //mongoose.connect('mongodb://127.0.0.1/mydb', {useNewUrlParser: true});     // connect to mongoDB database on modulus.io
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

	// var extras = [
		// {text:"uid", des:"User ID"}, 
		// {text: "fbid", des:"Feedback ID"},
		// {text:"pmid", des:"Payment ID"},
		// {text:"date", des:"Date"},
		// {text:"reason", des:"Reason"},
		// ]; //extra features for template
	
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
	var Extra = mongoose.model('Extra', new Schema ({text: String, des: String}))
	var Email = mongoose.model('Email', new Schema ({code: String, mail: String}))

	// routes ======================================================================

    // api ---------------------------------------------------------------------
    // get all todos
    app.get('/api/projects', function(req, res) {		
        /* Project.find(function(err, projs) {
            if (err)
                res.send(err)
            res.json(projs); // return all todos in JSON format
        }); */		
		getProjects().then(p=>res.send(p));
    });
	
	app.get('/api/extras', function(req, res) {		
		getExtras().then(e=>res.send(e));
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
	
	async function getExtras(){
		var extras = await Extra.find(function(err, ex) {
            if (err) console.log(err);
            return ex;
        });
		return extras;
	}
	
	async function getProjects(){
		var projects = await Project.find(function(err, projs) {
            if (err) console.log(err);
            return projs;
        });
		return projects;
	}
	
	function isEmpty(objectInput) {
		for ( name in objectInput) {
			return false;
		}
		return true;
	}
	
	app.get('/api/email', function(req,res) {
		Email.find(function(err,m){
			if(err) console.log(err);
			res.send(m);
		});
	})
	
	app.post('/api/extras', function(req,res) {
		var tag = req.body.tag;
		var trimtag = tag.toLowerCase().replace(/\s/g,'');
		var options = { upsert: true, new: true, setDefaultsOnInsert: true };
		
		Extra.findOneAndUpdate({text: trimtag},{text: trimtag, des: tag},options,function(err,doc){
			if(err) console.log(err);
			getExtras().then(e => res.send(e));
		});
	})
	
    // create project
    app.post('/api/add', function(req, res) {
        // Case 1: Update project -> Same ID, same name
		// Case 2: Create new project -> New ID, new name
		// Case 3: Create new project but same name -> New ID, same name
		// Update when same ID, insert when new ID and different name
		var data = req.body;
		var msg = "";
		console.log(data);
		var update = {name : data.proj.name};
		var query = {$or: [{_id: data.proj._id},{name: data.proj.name}]};
		var options = { upsert: true, new: true, setDefaultsOnInsert: true };
		
		
		Project.findOneAndUpdate(query, update, options, function(err, doc){
			if (err) {console.log(err); return;}
			
			if(isEmpty(data.task) && isEmpty(data.topic)) { msg = "Project upsert successfully";}
			
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
						
					}
				);
			}
			Project.find(function(err, projs) {
				if (err)
					res.send(err)
				result = {"projs" : projs, "msg" : msg};
				res.json(result); // return all todos in JSON format
			});
		});
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
        
		console.log(req.body.proj._id);
		console.log(req.body.topic._id);
		console.log(req.body.task._id);
		Project.findById(req.body.proj._id, 
			function (err, doc) {
				console.log(doc.topics);
				if (err) {
					console.log(err);
				}				
				res.json(doc.topics.id(req.body.topic._id).tasks.id(req.body.task._id).template);
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
	
	const PORT = 8080;
	// listen (start app with node server.js) ======================================
    app.listen(PORT,function(){
		 console.log('Your node js server is running on PORT:',PORT);
	});
   