// public/core.js
var scotchTodo = angular.module('scotchTodo', []);

function mainController($scope, $http) {
    $scope.formData = {'text':'Fuck Khoi Bitch'};
	$scope.cats = {};
	$scope.topics = {};
	$scope.tasks = {};
	
	var t = 'Fuck Khoi Bitch';
    // when landing on the page, get all todos and show them
    $http.get('/api/todos')
        .success(function(data) {
            $scope.cats = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });

    // when submitting the add form, send the text to the node API
    $scope.createTodo = function() {
		$http.post('/api/todos', $scope.formData)
			.success(function(data) {
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			})
			
		/*
        $http.post('/api/todos', $scope.formData)
            .success(function(data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
		*/
    };

    // delete a todo after checking it
    $scope.deleteTodo = function(id) {
        $http.delete('/api/todos/' + id)
            .success(function(data) {
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };
	
	$scope.getTopic = function(id){
		$http.get("api/topics",{params: {project_id: id}})
			.success(function(data) {
				$scope.topics = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	}
	
	$scope.getTask = function(id){
		$http.get("api/tasks",{params: {topic_id: id }})
			.success(function(data) {
				$scope.tasks = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	}
}