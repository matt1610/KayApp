

KayApp.controller('GameCtrl', function( $scope, $cordovaDeviceMotion, $rootScope, $state, Local, Bidim, $ionicPlatform, AppAnalytics ){

	$scope.StopGame = function() {
		stop();
		$state.go('app.home');
		$rootScope.GameOn = false;
	}
    
    
      $ionicPlatform.ready(function(){        
            AppAnalytics.trackPageViewed('Bidim Game');      
   });
    

	$scope.User = Local.GetLogin().User;

	$scope.Score = 0;

	var box = document.getElementById('box'),
	gameArea = document.getElementById('gameArea'),
	powerBar = document.getElementById('powerBar'),
	boxRight = screen.width - 80,
	boxPos = 10,
	itemPos = 0,
	boxVelocity = 0.1,
	itemVelocity = 0.05,
	// itemVelocity = 0.2,
	limit = 300,
	lastTimeStamp = 0,
	maxFPS = 60,
	delta = 0,
	timeStep = 1000 / $rootScope.TimeStep,
	numUpdateSteps = 0,
	fps = 60,
	framesThisSecond = 0,
	lastFpsUpdate = 0,
	frameID,
	running = false,
	started = false,
	timeBetweenSpawns = 4225,
	lastSpawn = 0,
	itemsToSpawn = 1,
	accelerationRate = 0.008,
	spaceBetweenObjects = -80,
	score = 0,
	allItems = [];
	$rootScope.GameOn = true;

	box.style.right = boxRight + 'px';
	var boxHeight = $(box).height();
	
	$scope.Result;
	$scope.TimeLeft = 30;
	$scope.ShowResult = false;

	document.addEventListener("deviceready", function () {
		var options = { frequency: timeStep };
		var watch = $cordovaDeviceMotion.watchAcceleration(options);
	    watch.then(
	      null,
	      function(error) {
	      // An error occurred
	      },
	      function(result) {
	        boxVelocity = (result.y / 10).toFixed(2);
	    });
	});

	// start();

	$scope.StartGame = function() {
		start();
	}

	// GAME LOOP

	function begin() {

	}

	function end() {

	}

	function GameOver(score) {
		stop();
		showResult(Math.floor(score/2));
	}

	function showResult(grade) {
		$scope.ShowResult = true;
		$scope.Product = Bidim[Math.floor(grade/2)];
		$scope.$apply();
	}

	$scope.Reset = function() {
		started = false;
		$scope.Started = started;
		$scope.ShowResult = false;
		score = 0;
		allItems = [];
		delta = 0;
		$scope.TimeLeft = 30;
		lastSpawn = 0;
		itemsToSpawn = 1;
		$('._jsItem').remove();
		$scope.$apply();
		powerBar.style.width = '0px';
	}

	function stop() {
		running = false;
		cancelAnimationFrame(frameID);
	}

	function start() {
		if (!started) {
			started = true;

			$scope.Started = started;
			$scope.$apply();

			var timer = setInterval(function() {
				$scope.TimeLeft--;
				$scope.$apply();
				if ($scope.TimeLeft < 1) {
					GameOver(score);
					clearInterval(timer);
				};
			},1000)

			$rootScope.GameOn = true;

			frameID = requestAnimationFrame(function(timestamp) {
				draw(1);
				running = true;
				lastTimeStamp = timestamp;
				lastFpsUpdate = timestamp;
				framesThisSecond = 0;
				frameID = requestAnimationFrame(mainLoop);
			});
		};
	}

	function panic() {
		delta = 0;
	}

	function draw() {
		box.style.top = boxPos + 'px';
		
		for (var i = 0; i < allItems.length; i++) {
			var item = allItems[i];
			item.item.style.right = item.position + 'px';

			if (allItems[i].item.style.right.split('.',1) > screen.width) {
				$(item.item).remove();
			};

			// Check for collision
			var itemTop = parseInt(item.item.style.top.split('.',1));
			var boxTop = parseInt(box.style.top.split('.',1));
			if (item.position > boxRight && item.position < boxRight + boxHeight) {

				if (itemTop > boxTop && itemTop < boxTop + boxHeight) {
					gotHim(item.item, i);
				};

				
			};
		};
	}

	function gotHim(item, i) {
		$(item).remove();
		allItems.splice(i,1);
		score++;
		if (score == 20) {
			GameOver(score);
		};
		$scope.Score = score;
		powerBar.style.width = score * 10 + 'px';
		$scope.$apply();
	}

	function update(delta, timestamp) {
		boxPos += boxVelocity * delta;

		for (var i = 0; i < allItems.length; i++) {
			var item = allItems[i];
			item.position += ((Math.random().toFixed(1))/5) + item.accel * delta;
			// item.position += itemVelocity * delta;
			item.accel += accelerationRate;
			if (item.position > 0 && !item.accelerated) {
				item.accel = accelerationRate;
				item.accelerated = true;
			};
		};

		if (timestamp > lastSpawn + timeBetweenSpawns) {
			spawn(timestamp);
		};
		

	}

	function spawn(timestamp) {
		lastSpawn = timestamp;
		
		for (var i = 0; i < itemsToSpawn; i++) {
			var height = (Math.floor(Math.random() * 9) + 1);
			var calcedHeight = (screen.height / 10) * height;
			$('._jsGameArea').append('<p class="_jsItem GameItem" style="top: '+calcedHeight+'px;" id="item'+allItems.length+'""></p>');
			var item = document.getElementById('item'+allItems.length);
			allItems.push({item : item, position : i * spaceBetweenObjects, accel : accelerationRate});
		};
		itemsToSpawn++;
	}

	function mainLoop(timestamp) {

		if (timestamp < lastTimeStamp + (1000 / maxFPS)) {
			frameID = requestAnimationFrame(mainLoop);
			return;
		};

//		Calculate Frames this second
		if (timestamp > lastFpsUpdate + 1000) {
			fps = 0.25 * framesThisSecond + (1 - 0.25) * fps;
			lastFpsUpdate = timestamp;
			framesThisSecond = 0;
		};
		framesThisSecond++;

//		Calculate time between updates (delta)
		delta += timestamp - lastTimeStamp;
		lastTimeStamp = timestamp;

		while (delta >= timeStep) {
			update(timeStep, timestamp);
			delta -= timeStep;
			if (++numUpdateSteps >= 240) {
				panic();
				break;
			};
		}
		
		draw();
		frameID = requestAnimationFrame(mainLoop);
		
	} // End Main Loop


});