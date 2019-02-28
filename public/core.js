// public/core.js

// Add/remove function
// Add/remove UI
// Embedded text file in Database
// Input validation
// conditions for FBID,PMID, userID
// getTask
// restructure project

angular.module('scotchTodo',['ngAnimate', 'toaster','ngTagsInput','720kb.datepicker'])

.controller('mainController', function($scope, $http, toaster) {

    $scope.formGet = {};
	$scope.formAdd = {};
	$scope.projs = {};
	$scope.topics = {};
	$scope.tasks = {};
	$scope.template = "";
	$scope.extras = {};
    // when landing on the page, get all todos and show them
    $http.get('/api/projects')
        .then(function(res) {
            $scope.projs = res.data;
            //console.log(res);
        }, function(err) {
            console.log('Error: ' + err);
        });
	
	$http.get('/api/extras')
		.then(function(res) {
			$scope.extras = res.data;
		},function(err){
			console.log('Error: ' + err);
        });
    
	// when submitting the add form, send the text to the node API
    $scope.submitForm = function(isValid) {
		$scope.submitted = true;
		if(isValid){
			$http.post('/api/add', $scope.formAdd)
			.then(function(res) {
				//$scope.tasks = res.data;
				console.log(res.data);
				toaster.pop('success', null, res.data.msg, 2000, 'trustedHtml');
				$scope.formAdd = {};
				$scope.formGet = {};
				$scope.projs = res.data.projs;
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
	
	function isEmpty(obj) {
		for ( name in obj) {
			return false;
		}
		return true;
	}
	
	$scope.getEmail = function(code){
		$http.post('/api/email', {code: code})
			.then(function(res) {
				console.log(res);
				$scope.email_template = res.data;
			}, function(err) {
				console.log('Error: ' + err);
			})
	}
	
	$scope.checkDateTag = function(obj){
		if(!isEmpty(obj)){
			for(i = 0; i < obj.extras.length; i++){
				if(obj.extras[i].text === "date") return true;
			}
		}
		return false;
	}
	$scope.filterDateTag = function(a){
		if(a.text == "date") return false;
		return true;
	}
	
	$scope.addField = function(extra){
		if(isEmpty($scope.formAdd.task.extras)) $scope.formAdd.task.extras = [];
		if(!isEmpty($scope.formAdd.task)) {
			if (!$scope.formAdd.task.extras.some(e => e.text === extra.text)) {
				$scope.formAdd.task.extras.push(extra);
			}			
		}
		console.log($scope.formAdd.task);
	}
	
	$scope.getTemplate = function() {
		$http.post('/api/template', $scope.formGet)
			.then(function(res) {
				var t = res.data;
				//console.log(t);
				var ex = $scope.formGet.task.extras;
				for(i = 0; i < ex.length; i++){
					var r = $('input[name=' + ex[i].text + "]").val();
					t = t.replace("(" + ex[i].text + ")",r);
					//console.log(r)
				}
				$scope.template = t;
				//console.log(t);
				//$scope.formGet = {};
			}, function(err) {
				console.log('Error: ' + err);
			})
    };
	
	$scope.copyToClipboard = function(textareaId){
		var doc = document.getElementById(textareaId);
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
		//var id = proj._id;
		//console.log(proj);
		if (id==null) return;
		$http.get("api/topics",{params: {projectId: id}})
			.then(function(res) {
				$scope.topics = res.data;
				//console.log(res);
			}, function(err) {
				console.log('Error: ' + err);
			});
	}
	
	$scope.getTasks = function(topic){
		var p = $scope.formGet.projId;
		var t = $scope.formGet.topicId;
		//console.log(p + '\n' + t);
		if (p==null || t ==null) return;
		$http.get("api/tasks",{params: {projectId: p, topicId: t }})
			.then(function(res) {
				$scope.tasks = res.data;
				//console.log(res);
			}, function(err) {
				console.log('Error: ' + err);
			});
	}  

})
.directive('editableSelect', function() {
  return {
    restrict: 'E',
    require: '^ngModel',
	transclude: true,
    scope: {
      ngModel: '=',
	  input: '=',
      options: '=',
      other: '@',
	  name: '@',
	  holder: '@',
	  output:'='
    },
    replace: true,
    templateUrl: 'editable-select-tpl.html', 
    link: function(scope, element) {
      scope.isDisabled = true;
	  
      scope.click = function(option) {
        
        scope.isDisabled = !scope.other || scope.other !== option;
        if (!scope.isDisabled) { // If other is selected
			scope.ngModel = {name: option};
			element[0].querySelector('.editable-select').focus();
        }
		else{
			scope.ngModel = option;
			
			//var r = scope.options.filter((s) => s._id === option._id);
			
		}

		//console.log(option);
      };
      
      var unwatch = scope.$watch('ngModel', function(val) {
        if (!scope.isDisabled) {
          //scope.other = scope.ngModel.name;
        }
		if(scope.name == "project"){
			scope.input.task = {};
			scope.input.topic = {};
		}
		else if(scope.name == "topic"){
			scope.input.task = {};
		}
      });
      
      scope.$on('$destroy', unwatch);
    }
  };
}); 
