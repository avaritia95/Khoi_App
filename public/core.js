// public/core.js

// Add/remove function
// Add/remove UI
// Embedded text file in Database
// Input validation
// conditions for FBID,PMID, userID
// getTask
// restructure project

angular.module('scotchTodo',['ngAnimate', 'toaster']).controller('mainController', function($scope, $http, toaster) {

    $scope.formGet = {};
	$scope.formAdd = { projname: '', topicname: '', taskname: '', template: ''};
	$scope.projs = {};
	$scope.topics = {};
	$scope.tasks = {};
	$scope.template = "";

    // when landing on the page, get all todos and show them
    $http.get('/api/projects')
        .then(function(res) {
            $scope.projs = res.data;
            console.log(res);
        }, function(err) {
            console.log('Error: ' + err);
        });

    // when submitting the add form, send the text to the node API
    $scope.submitForm = function(isValid) {
		$scope.submitted = true;
		if($scope.formAdd.projname.length > 0) $scope.formAdd.addType = "project";
		if($scope.formAdd.topicname.length > 0) $scope.formAdd.addType = "topic";
		if($scope.formAdd.taskname.length > 0) $scope.formAdd.addType = "task";
		alert($scope.formAdd.addType)
		if(isValid){
			$http.post('/api/add', $scope.formAdd)
			.then(function(res) {
				$scope.tasks = res.data;
				console.log(res);
				toaster.pop('success', null, res.data, 2000, 'trustedHtml');
			}, function(err) {
				console.log('Error: ' + err);
			})
		}
		
			
		/*
        $http.post('/api/todos', $scope.formGet)
            .success(function(data) {
                $scope.formGet = {}; // clear the form so our user is ready to enter another
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
		*/
    };
	
	$scope.getTemplate = function() {
		$http.post('/api/template', $scope.formGet)
			.then(function(res) {
				var t = res.data;
				console.log(t);
				//var t = "This is\n bullshit";
				if($scope.formGet.task.idrequired)
					$scope.template =  t.replace("(userid)",$scope.formGet.userid);
				else
					$scope.template =  t;
				
				
				//console.log(t);
				//$scope.formGet = {};
			}, function(err) {
				console.log('Error: ' + err);
			})
    };
	
	$scope.copyToClipboard = function(){
		var doc = document.getElementById('textareaShow');
		doc.select();
		document.execCommand('copy');
	};
	
	$scope.clearTodo = function() {
		$http.post('/api/clear', {})
			.then(function(res) {
				console.log(res);
				$scope.cats = res.data;
			}, function(err) {
				console.log('Error: ' + err);
			})
	}

    // delete a todo after checking it
    $scope.deleteTodo = function(id) {
        $http.delete('/api/todos/' + id)
            .then(function(data) {
                $scope.todos = data;
                console.log(data);
            }, function(err) {
                console.log('Error: ' + err);
            });
    };
	
	$scope.getTopics = function(id){
		console.log(id);
		if (id==null) return;
		$http.get("api/topics",{params: {projectId: id}})
			.then(function(res) {
				$scope.topics = res.data;
				console.log(res);
			}, function(err) {
				console.log('Error: ' + err);
			});
	}
	
	$scope.getTasks = function(p,t){
		console.log(p + '\n' + t);
		if (p==null || t ==null) return;
		$http.get("api/tasks",{params: {projectId: p, topicId: t }})
			.then(function(res) {
				$scope.tasks = res.data;
				console.log(res);
			}, function(err) {
				console.log('Error: ' + err);
			});
	}  

});