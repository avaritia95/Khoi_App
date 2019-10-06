// public/core.js

angular.module('Khoi_App',['ngRoute', 'toaster', 'ui.bootstrap']) // using ngAnimate, toaster, ngTagsInput, datepicker modules
.controller('mainController', function($scope, $http, toaster, $uibModal) {

	$scope.formAdd = {};
	$scope.jira = {};
	$scope.dateOptions = {
		maxDate: new Date(2020, 5, 22),
		minDate: new Date(),
		startingDay: 1
		
  };

	// when landing on the page, get all projects and show them
    $scope.getProjects = function() {
		$http.get('/api/projects') // Send GET request to specified url
		.then(function(res) {
			$scope.formAdd.projs = res.data;
		}, function(err) {
			console.log('Error: ' + err);
		});
	}
	
	// when landing on the page, get all mails and show them
	$scope.getEmails = function() {
		$http.get('/api/email')  // Send GET request to specified url
			.then(function(res) {
				$scope.countries = res.data;
			},function(err){
				console.log('Error: ' + err);
			});
	}	
	// when submitting the add form, send the POST request to the node API
    $scope.submitForm = function(isValid) { // Submit form
		$scope.submitted = true;
		
		if(isValid){
			$http.post('/api/add', $scope.formAdd)
			.then(function(res) {
				displayAddError(res.data.msg);
				$scope.formAdd = {};
				$scope.formAdd.projs = res.data.projs;
				console.log(res.data);
			}, function(err) {
				console.log('Error: ' + err);
			})
			//console.log($scope.formAdd)
		}
    };
	
	// function to open login modal
	$scope.openLoginModal = function () {
		var modalInstance = $uibModal.open({
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'partials/login.html',
			controller: 'ModalInstanceCtrl',
			controllerAs: '$ctrl',
			size: 'sm',
			windowClass : 'show'
		});
		console.log('Dialog opened')
		modalInstance.result.then(function (login) {
		  console.log(login);
		  $scope.jira.user = login.user;
		  $scope.jira.pass = login.pass;
		}, function () {
		  console.log('Modal dismissed at: ' + new Date());
		});
	};
	
	// Check object is empty
	function isEmpty(obj) {
		for ( name in obj) {
			return false;
		}
		return true;
	}
	
	function displayAddError(errs) {
		for (var i = 0; i < errs.length; i++) {
			if(errs[i].includes("success")) toaster.pop('success', null, errs[i], 3000, 'trustedHtml');
			else if (errs[i].includes("Error")) toaster.pop('error', null, errs[i], 3000, 'trustedHtml');
		}
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
	
	$scope.extractExtras = function(template) {
		if(!template) return [];
		var extras = [];
		var temp = template.split('{');
		for(var i = 1; i < temp.length; i++) {
			extras.push(temp[i].split('}')[0]);
		}
		return extras;
	}
	$scope.generateTemplate = function() {
		var t = $scope.formAdd.proj.topic.task.template;
		var ex = $scope.extractExtras(t)
		for(i = 0; i < ex.length; i++){
			var r = $('input[name=' + ex[i] + "]").val();
			t = t.replace("{" + ex[i]+ "}",r);
		}
		$scope.formAdd.copyTemplate = t;				
	}
	
	// when landing on the page, get all extra fields and show them
	/*$scope.getExtras = function() {
		$http.get('/api/extras')  // Send GET request to specified url
		.then(function(res) {
			$scope.extras = res.data;
		},function(err){
			console.log('Error: ' + err);
        });
    }*/
	// Add extra field
	/*$scope.addExtra = function(t){
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
		var extras = $scope.formAdd.proj.topic.task.extras;
		//if($scope.formAdd.task.extras) $scope.formAdd.task.extras = [];
		if (!extras.some(e => e.text === extra.text)) { // If the task does not have this extra field, then add
			extras.push(extra);
		}			
		//console.log($scope.formAdd.task);
	}*/
	
	
	// Get template and replace extra fields with input values
	/*$scope.getTemplate = function() {
		$http.post('/api/template', $scope.formGet)
			.then(function(res) {
				var t = res.data;
				var ex = $scope.formGet.task.extras;
				for(i = 0; i < ex.length; i++){
					var r = $('input[name=' + ex[i].text + "]").val();
					t = t.replace("{" + ex[i].text + "}",r);
				}
				$scope.template = t;				
				//console.log(t);
				//$scope.formGet = {};
			}, function(err) {
				console.log('Error: ' + err);
			})
    };*/
	// field the Jira template with input values
	$scope.getJiraTemplate = function(){
		var checkedAccountIDVar = $scope.jira.checkedAccountID;
		var figuredOutTextAreaVar = $scope.jira.figuredOutTextArea;
		var userEmailAddressVar = $scope.jira.userEmailAddress;
		var emailBodyTextAreaVar = $scope.jira.emailBodyTextArea;
		var additionalStepsTextAreaVar = $scope.jira.additionalStepsTextArea;
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
		$scope.jira.template = newTemplateOutput;
	}
	
	// Copy content of text area to clipboard 
	$scope.copyToClipboard = function(textareaId){
		var doc = document.getElementById(textareaId);
		doc.select();
		document.execCommand('copy');
	};
	
	$scope.commentTicket = function(){
		var request = {
			auth: btoa($scope.jira.user + ':' + $scope.jira.pass),
			url : '/rest/api/2/issue/' + $scope.jira.ticketKey + '/comment',
			comment: $scope.jira.template			
		}
		$http.post('/api/jira/comment', request).then(function(res) {
			console.log(res.body);
			$scope.jira.commentLink = res.data.self;
			if(res.data.statusCode == 200) {
				toaster.pop('success', 'New comment is added successfully', 'Link: <a href={{$scope.jira.commentLink}}>{{$scope.jira.commentLink}}</a>', 4000, 'trustedHtml');
			}
			else if (res.data.statusCode == 401 || res.data.statusCode == 403){
				toaster.pop('error', 'Unauthorized access', 'Please recheck your username and password', 4000, 'trustedHtml');
			}
			else if (res.data.statusCode == 400){
				toaster.pop('error', 'Invalid value or missing field', 'Please recheck comment', 4000, 'trustedHtml');
			}
		}, function(err) {
			console.log(err);
		}) 
	}
	// Copy content of div to clipboard
	/*$scope.copyToClipboardwithFormat = function(element) {
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
	}*/
})
.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance) {
	$scope.login = { user: 'D1234', pass: 'D1234'}
	$scope.ok = function () {
		console.log($scope.login);
		$uibModalInstance.close($scope.login);
	};

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};
})
.directive('editableSelect', function() { // Directive for editable-select
  return {
    restrict: 'E',
    require: '^ngModel',
	transclude: true,
    scope: {
      ngModel: '=',
      options: '=',
      other: '@',
	  holder: '@',
	  name: '@'
    },
    replace: true,
    templateUrl: 'editable-select-tpl.html', 
    link: function(scope, element) {
      scope.isDisabled = true;
	  
      scope.click = function(option) {
        
        //scope.isDisabled = !scope.other || scope.other !== option;
		
        if (!option._id) { // If other is selected
			scope.ngModel = {name: 'Create new'};
			element[0].querySelector('.editable-select').focus();
        }
		else{
			scope.ngModel = option;
		}
      };
      
      var unwatch = scope.$watch('ngModel.name', function(val) {
		if (scope.options && val && !scope.ngModel._id && scope.options.some(e => e.name == val)) {
			var result = confirm('You are creating a ' + scope.name + 
				' that has same name with existed one! Do you wish to switch to existed ' + scope.name + '?');
			if(result) scope.ngModel = scope.options.filter(e => e.name == val)[0];
		}
	  });
      
      scope.$on('$destroy', unwatch);
    }
  };
});