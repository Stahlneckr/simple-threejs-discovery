FallMaze = function() {
  return {
    scene           : null,
    camera          : null,
    renderer        : null,
    skyBox          : null,
    platform_array  : null,
    hole_array      : null,
    ball            : null,
    controls        : null,
    keyboard        : null,

    sceneSetup: function() {

      // create scene
      scene = new Physijs.Scene({ fixedTimeStep: 1 / 60 });
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
      var axes = new THREE.AxisHelper(100);
      scene.add( axes );
      
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

    },
    ballAnimation: function() {
      var geometry = new THREE.SphereGeometry( 7,24,24 );
      // var material = new THREE.MeshBasicMaterial( { color: 0xFF9800 } );
      var material = Physijs.createMaterial( new THREE.MeshLambertMaterial( { color: 0xFF9800, reflectivity: 0.8 } ), 0.0, 0.8 );
      ball = new Physijs.SphereMesh( geometry, material, 100 );
      ball.position.y = 100;
      ball.setCcdMotionThreshold( 0.1 );
      ball.setCcdSweptSphereRadius( 1 )

      scene.add( ball );

    },
    platformSetup: function() {
      // // Boxx
      platform_array = [];
      var geometry = new THREE.CubeGeometry( 500, 10, 500 );
      var hole_geometry = new THREE.CubeGeometry( 50, 11, 50 );

      var floorTexture = new THREE.ImageUtils.loadTexture( 'images/floor01.jpg' );
      floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
      floorTexture.repeat.set( 10, 10 );
      // var material = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
      var material = Physijs.createMaterial( new THREE.MeshLambertMaterial( { color: 0xEEEEEE } ), 0.2, 0.8  );
      var hole_material = Physijs.createMaterial( new THREE.MeshLambertMaterial( { color: 0x000000, side: THREE.DoubleSide } ), 0.2, 0.8  );
      for(var i=0; i<20; i++) {

        platform_array[i] = { platform: null, hole: null };

        // platform
        platform_array[i].platform = new Physijs.BoxMesh(geometry, material, 0);
        platform_array[i].platform.position.y = -i*300;
        // var platformBSP = new ThreeBSP( platform_array[i].platform );

        // hole
        platform_array[i].hole = new Physijs.BoxMesh(hole_geometry, hole_material, 0);
        platform_array[i].hole.position.y = -i*300;
        platform_array[i].hole.position.x = Math.floor(Math.random()*(251))*(Math.random() < 0.5 ? -1 : 1);
        platform_array[i].hole.position.z = Math.floor(Math.random()*(251))*(Math.random() < 0.5 ? -1 : 1);
        // var holeBSP = new ThreeBSP( platform_array[i].hole );
        // console.log(holeBSP.matrix);
        // holeBSP.matrix.elements[0] = 10;
        // holeBSP.matrix.elements[5] = 10;
        // holeBSP.matrix.elements[10] = 10;
        // holeBSP.matrix.elements[15] = 10;
        // console.log(holeBSP.matrix);

        // platformBSP = platformBSP.subtract(holeBSP);
        // platform_array[i].platform = platformBSP.toMesh(material);
        // platform_array[i].platform.position.y = -i*300;
        // platform_array[i].platform.position.x = 50;



        scene.add( platform_array[i].platform );
        scene.add( platform_array[i].hole );
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

      var rotateAngle = Math.PI / 180;   // pi/2 radians (90 degrees) per second

      if ( keyboard.pressed("left") ) { 
        if( platform_array[0].platform.rotation.z < 0.524 ) {
          platform_array[0].platform.rotation.z += rotateAngle/2;
          platform_array[0].platform.__dirtyRotation = true;
          platform_array[0].hole.rotation.z += rotateAngle/2;
          platform_array[0].hole.__dirtyRotation = true;
        }
      }
      if ( keyboard.pressed("right") ) { 
        if(platform_array[0].platform.rotation.z > -0.524) {
          platform_array[0].platform.rotation.z -= rotateAngle/2;
          platform_array[0].platform.__dirtyRotation = true;
          platform_array[0].hole.rotation.z -= rotateAngle/2;
          platform_array[0].hole.__dirtyRotation = true;
        }
      }
      if ( keyboard.pressed("up") ) { 
        if( platform_array[0].platform.rotation.x < 0.524 ) {
          platform_array[0].platform.rotation.x += rotateAngle/2;
          platform_array[0].platform.__dirtyRotation = true;
          platform_array[0].hole.rotation.x += rotateAngle/2;
          platform_array[0].hole.__dirtyRotation = true;
        }
      }
      if ( keyboard.pressed("down") ) { 
        if(platform_array[0].platform.rotation.x > -0.524) {
          platform_array[0].platform.rotation.x -= rotateAngle/2;
          platform_array[0].platform.__dirtyRotation = true;
          platform_array[0].hole.rotation.x -= rotateAngle/2;
          platform_array[0].hole.__dirtyRotation = true;
        }
      }

      camera.position.y -= .25;
      skyBox.position.y -= .25;
      camera.lookAt(new THREE.Vector3(0,camera.position.y-200,0));

      renderer.render( scene, camera );

      controls.update();
    }
  };
}();