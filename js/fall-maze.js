FallMaze = function() {
  return {
    scene             : null,
    camera            : null,
    renderer          : null,
    skyBox            : null,
    platform_array    : null,
    hole_array        : null,
    ball              : null,
    controls          : null,
    keyboard          : null,
    current_platform  : null,

    sceneSetup: function() {

      // create scene
      scene = new Physijs.Scene();
      scene.setFixedTimeStep(1/200);
      scene.setGravity(new THREE.Vector3( 0, -500, 0 ));
      scene.fog = new THREE.FogExp2( 0xffffff, 0.00015 );

      // create camera
      camera = new THREE.PerspectiveCamera( 45, $(window).width() / $(window).height(), 0.1, 20000 );
      camera.position.set( 0, 200, 750 );
      camera.lookAt( scene.position );

      renderer = new THREE.WebGLRenderer();
      renderer.setSize( $(window).width(), $(window).height() );
      $('body').append( renderer.domElement );

      // create a point light
      var pointLight = new THREE.PointLight(0xFFFFFF);
      pointLight.position.set(0,200,100);
      scene.add(pointLight);

      // add events
      FallMaze.windowResize(renderer, camera);

      // add controls
      controls = new THREE.OrbitControls( camera, renderer.domElement );

      // add keyboard
      keyboard = new THREEx.KeyboardState();

      // axes
      // var axes = new THREE.AxisHelper(100);
      // scene.add( axes );
      
      // add skybox
      var imagePrefix = "images/alps-";
      var directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
      var imageSuffix = ".png";
      var skyGeometry = new THREE.CubeGeometry( 5000, 5000, 5000 ); 
      
      var materialArray = [];
      for (var i = 0; i < 6; i++)
        materialArray.push( new THREE.MeshBasicMaterial({
          map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
          side: THREE.BackSide
        }));
      var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
      skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
      scene.add( skyBox );

      // start at 0
      current_platform = 0;

    },
    ballSetup: function() {
      // ball
      var geometry = new THREE.SphereGeometry( 7,24,24 );
      var material = Physijs.createMaterial( new THREE.MeshLambertMaterial( { color: 0xFF9800, reflectivity: 1.0 } ), 0.0, 0.8 );
      ball = new Physijs.ConvexMesh( geometry, material, 100 );
      ball.position.y = 100;

      // help ball not pass through platform
      ball.setCcdMotionThreshold( 10 );
      ball.setCcdSweptSphereRadius( 1 )

      scene.add( ball );

    },
    platformSetup: function() {

      platform_array = [];
      var geometry = new THREE.BoxGeometry( 500, 10, 500 );
      var hole_geometry = new THREE.CylinderGeometry( 25, 25, 10.1, 50, 1 );

      var material = Physijs.createMaterial( new THREE.MeshLambertMaterial( { color: 0xEEEEEE } ), 0.2, 0.8  );
      var hole_material = Physijs.createMaterial( new THREE.MeshLambertMaterial( { color: 0x000000, side: THREE.DoubleSide } ), 0.2, 0.8  );

      // textured floor material
      // var floorTexture = new THREE.ImageUtils.loadTexture( 'images/floor01.jpg' );
      // floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
      // floorTexture.repeat.set( 10, 10 );
      // var material = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );

      for(var i=0; i<20; i++) {

        platform_array[i] = { platform: null, hole: null };

        // platform
        platform_array[i].platform = new Physijs.BoxMesh(geometry, material, 0);
        platform_array[i].platform.position.y = -i*300;

        // hole
        platform_array[i].hole = new Physijs.CylinderMesh(hole_geometry, hole_material, 0);
        platform_array[i].hole.position.x = Math.floor(Math.random()*(201))*(Math.random() < 0.5 ? -1 : 1);
        platform_array[i].hole.position.z = Math.floor(Math.random()*(201))*(Math.random() < 0.5 ? -1 : 1);

        // Combine hole and platform
        platform_array[i].platform.add(platform_array[i].hole);

        scene.add( platform_array[i].platform );
        // scene.add( platform_array[i].hole );

      }

    },
    windowResize: function(renderer, camera, dimension) {
      var callback  = function(){
        var rendererSize = { width: $(window).width(), height: $(window).height() };
        renderer.setSize( rendererSize.width, rendererSize.height )
        camera.aspect = rendererSize.width / rendererSize.height
        camera.updateProjectionMatrix()
      }

      window.addEventListener('resize', callback, false)
      return {
        trigger : function(){
          callback()
        },
        destroy : function(){
          window.removeEventListener('resize', callback)
        }
      }
    },
    render: function() {

      requestAnimationFrame( FallMaze.render );
      scene.simulate();

      var rotateAngle = Math.PI / 180;

      if ( keyboard.pressed("left") ) { 
        if( platform_array[current_platform].platform.rotation.z < 0.524 ) {
          platform_array[current_platform].platform.rotation.z += rotateAngle/2;
          platform_array[current_platform].platform.__dirtyRotation = true;
        }
      }
      if ( keyboard.pressed("right") ) { 
        if(platform_array[current_platform].platform.rotation.z > -0.524) {
          platform_array[current_platform].platform.rotation.z -= rotateAngle/2;
          platform_array[current_platform].platform.__dirtyRotation = true;
        }
      }
      if ( keyboard.pressed("up") ) { 
        if( platform_array[current_platform].platform.rotation.x < 0.524 ) {
          platform_array[current_platform].platform.rotation.x += rotateAngle/2;
          platform_array[current_platform].platform.__dirtyRotation = true;
        }
      }
      if ( keyboard.pressed("down") ) { 
        if(platform_array[current_platform].platform.rotation.x > -0.524) {
          platform_array[current_platform].platform.rotation.x -= rotateAngle/2;
          platform_array[current_platform].platform.__dirtyRotation = true;
        }
      }

      // distance ball is from center of hole
      var distance = Math.sqrt(((ball.position.x-platform_array[current_platform].hole.position.x)*(ball.position.x-platform_array[current_platform].hole.position.x))+((ball.position.z-platform_array[current_platform].hole.position.z)*(ball.position.z-platform_array[current_platform].hole.position.z)));
      // remove platform when ball touches the hole
      if(distance < 25) {
        scene.remove(platform_array[current_platform].platform);
        current_platform++;
      }

      if(camera.position.y-platform_array[current_platform].platform.position.y>200) {
        camera.position.y -= .75;
        skyBox.position.y -= .75;
      } else {
        camera.position.y -= .25;
        skyBox.position.y -= .25;
      }
      camera.lookAt(new THREE.Vector3(0,camera.position.y-200,0));

      // add platform generation for infinite games

      renderer.render( scene, camera );

      controls.update();
    }
  };
}();