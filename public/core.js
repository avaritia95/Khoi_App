// public/core.js

angular.module('scotchTodo',['ngAnimate', 'toaster','ngTagsInput','720kb.datepicker']) // using ngAnimate, toaster, ngTagsInput, datepicker modules

.controller('mainController', function($scope, $http, toaster) {

    $scope.formGet = {};
	$scope.formAdd = {};
	$scope.projs = {};
	$scope.topics = {};
	$scope.tasks = {};
	$scope.template = "";
	$scope.extras = {};
    
	// when landing on the page, get all projects and show them
    $http.get('/api/projects') // Send GET request to specified url
        .then(function(res) {
            $scope.projs = res.data;
            console.log(res);
        }, function(err) {
            console.log('Error: ' + err);
        });
	
	// when landing on the page, get all extra fields and show them
	$http.get('/api/extras')  // Send GET request to specified url
		.then(function(res) {
			$scope.extras = res.data;
		},function(err){
			console.log('Error: ' + err);
        });
    
	// when landing on the page, get all mails and show them
	$http.get('/api/email')  // Send GET request to specified url
		.then(function(res) {
			$scope.countries = res.data;
		},function(err){
			console.log('Error: ' + err);
        });
		
	// when submitting the add form, send the POST request to the node API
    $scope.submitForm = function(isValid) { // Submit form
		$scope.submitted = true;
		if(isValid){
			$http.post('/api/add', $scope.formAdd)
			.then(function(res) {
				toaster.pop('success', null, res.data.msg, 2000, 'trustedHtml');
				$scope.formAdd = {};
				$scope.formGet = {};
				$scope.projs = res.data.projs;
			}, function(err) {
				console.log('Error: ' + err.msg);
			})
		}
    };
	
	// Check object is empty
	function isEmpty(obj) {
		for ( name in obj) {
			return false;
		}
		return true;
	}
	
	// Clear text area
	$scope.clearTextArea = function(){
		$scope.template = "";
	}
	
	// Create email template from email
	$scope.createMailTemplate = function(c){
		if(!isEmpty(c)){
			$scope.email_template = "Forwarded the payment ticket to the responsible accounting team " + c.mail.bold();
			
			var doc = document.getElementById("fakeTextAreaMail");
			doc.innerHTML = $scope.email_template;
		}
	}
	
	// Add extra field
	$scope.addExtra = function(t){
		if (t != null && t != ""){
			$http.post('/api/extras', {tag: t})
			.then(function(res) {
				//console.log(res);
				toaster.pop('success', null, "New field is added successfully", 2000, 'trustedHtml');
				$scope.extras = res.data;
			}, function(err) {
				console.log('Error: ' + err);
			})
		}
	}
	
	// Add tag to extra field requirement of task
	$scope.addField = function(extra){
		if(isEmpty($scope.formAdd.task.extras)) $scope.formAdd.task.extras = [];
		if(!isEmpty($scope.formAdd.task)) {
			if (!$scope.formAdd.task.extras.some(e => e.text === extra.text)) { // If the task does not have this extra field, then add
				$scope.formAdd.task.extras.push(extra);
			}			
		}
		//console.log($scope.formAdd.task);
	}
	
	// Get template and replace extra fields with input values
	$scope.getTemplate = function() {
		$http.post('/api/template', $scope.formGet)
			.then(function(res) {
				var t = res.data;
				var ex = $scope.formGet.task.extras;
				for(i = 0; i < ex.length; i++){
					var r = $('input[name=' + ex[i].text + "]").val();
					t = t.replace("(" + ex[i].text + ")",r);
				}
				$scope.template = t;				
				//console.log(t);
				//$scope.formGet = {};
			}, function(err) {
				console.log('Error: ' + err);
			})
    };
	// field the Jira template with input values
	$scope.getJiraTemplate = function()
	{
		var checkedAccountIDVar = $scope.checkedAccountID;
		var figuredOutTextAreaVar = $scope.figuredOutTextArea;
		var userEmailAddressVar = $scope.userEmailAddress;
		var emailBodyTextAreaVar = $scope.emailBodyTextArea;
		var additionalStepsTextAreaVar = $scope.additionalStepsTextArea;
		var templateOutput = "ANALYSIS \n" +
							 "-------------------------------------------------------------\n" +
							 "checked \n" +
							 "-------------------------------------------------------------\n" +
							 "RESULT \n" +
							 "-------------------------------------------------------------\n" +
							 "figured \n" +
							 "-------------------------------------------------------------\n" +
							 "USER COMMUNICATION \n" +
							 "sent mail to : email \n" +
							 "--------------------------------------------------------------\n" +
							 "Dear \n" +
							 "--------------------------------------------------------------\n" +
							 "ADDITIONAL STEPS \n" +
							 "--------------------------------------------------------------\n" +
							 "future" ;
		var newTemplateOutput = templateOutput.replace(new RegExp("checked",'g'),checkedAccountIDVar)
		.replace(new RegExp("figured",'g'),figuredOutTextAreaVar)
		.replace(new RegExp("email",'g'),userEmailAddressVar)
		.replace(new RegExp("Dear",'g'),emailBodyTextAreaVar)
		.replace(new RegExp("future",'g'),additionalStepsTextAreaVar);
		
		$scope.templateJira = newTemplateOutput;
	}
	
	// Copy content of text area to clipboard 
	$scope.copyToClipboard = function(textareaId){
		var doc = document.getElementById(textareaId);
		doc.select();
		document.execCommand('copy');
	};
	
	// Copy content of div to clipboard
	$scope.copyToClipboardwithFormat = function(element) {
			var doc = document
			var text = doc.getElementById(element)
			var range; var selection;
		
		if (doc.body.createTextRange)
		{
			range = doc.body.createTextRange();
			range.moveToElementText(text);
			range.select();
		} 
		
		else if (window.getSelection)
		{
			selection = window.getSelection();        
			range = doc.createRange();
			range.selectNodeContents(text);
			selection.removeAllRanges();
			selection.addRange(range);
		}
		document.execCommand('copy');
		window.getSelection().removeAllRanges();
		document.getElementById("btn").value="Copied";
	}


    // delete - not used
	/*
    $scope.deleteTodo = function(id) {
        $http.delete('/api/todos/' + id)
            .then(function(data) {
                $scope.todos = data;
                console.log(data);
            }, function(err) {
                console.log('Error: ' + err);
            });
    };
	*/
	
	// Send request with projectID to get topic list
	$scope.getTopics = function(id){
		$scope.clearTextArea();
		if (id==null) return;
		$http.get("api/topics",{params: {projectId: id}})
			.then(function(res) {
				$scope.topics = res.data;
				//console.log(res);
			}, function(err) {
				console.log('Error: ' + err);
			});
	}
	
	// Send request with projectID and topicID to get task list
	$scope.getTasks = function(projId,topicId){
		$scope.clearTextArea();
		var p = projId;
		var t = topicId;

		if (p==null || t ==null) return;
		$http.get("api/tasks",{params: {projectId: p, topicId: t }})
			.then(function(res) {
				$scope.tasks = res.data;
			}, function(err) {
				console.log('Error: ' + err);
			});
	}  

})
.directive('editableSelect', function() { // Directive for editable-select
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
		}
      };
      
      var unwatch = scope.$watch('ngModel', function(val) {
        if (!scope.isDisabled) {
          //scope.other = scope.ngModel.name;
        }
		if(scope.name == "project"){ // If the select for project is being used
			scope.input.task = {};
			scope.input.topic = {};
		}
		else if(scope.name == "topic"){ // If the select for topic is being used
			scope.input.task = {};
		}
      });
      
      scope.$on('$destroy', unwatch);
    }
  };
}); 
