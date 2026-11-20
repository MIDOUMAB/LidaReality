import * as THREE from '../../static/dist/three.js';
import {OrbitControls} from '../../static/dist/OrbitControls.js';
import { XYZLoader } from '../../static/dist/XYZLoader.js';
import { FontLoader } from '../../static/dist/FontLoader.js';
import { TextGeometry } from '../../static/dist/TextGeometry.js';
import {
    CSS2DRenderer,
    CSS2DObject,
} from '../../static/dist/CSS2DRenderer.js'

let camera,controls, scene, renderer,clock,points,labelRenderer,viewer;
init();
animate();
function init() {
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x000000 );
	scene.fog = new THREE.FogExp2( 0x000000, 0.002 );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

    labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.zIndex = 10;
    labelRenderer.domElement.id = 'labelObject';
    labelRenderer.visible = true;

    const main3D = document.getElementById('3d')
	// main3D.appendChild( renderer.domElement );
    

	camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( -5.5, 5.5, -30.5)
	// controls

	controls = new OrbitControls( camera, renderer.domElement );
	controls.listenToKeyEvents( window ); // optional

	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;

	controls.screenSpacePanning = false;

	// controls.minDistance = 100;
	// controls.maxDistance = 500;

	// controls.maxPolarAngle = Math.PI / 2;

	// world
    clock = new THREE.Clock();

    

    function zoomInTimeline(x, y, z, zoomOutFactor = 0){
        let tl = gsap
            .timeline({ defaults: { duration: 1.5, ease: "expo.out" } })
            .to(controls.target, { x, y, z })
            .to(camera.position, { x, y, z: z + zoomOutFactor }, 0)
            
    };
				

    const dirLight1 = new THREE.DirectionalLight( 0xffffff, 3 );
    dirLight1.position.set( 1, 1, 1 );
    scene.add( dirLight1 );

    const dirLight2 = new THREE.DirectionalLight( 0x002288, 3 );
    dirLight2.position.set( - 1, - 1, - 1 );
    scene.add( dirLight2 );

    const ambientLight = new THREE.AmbientLight( 0x555555 );
    scene.add( ambientLight );

    window.addEventListener( 'resize', onWindowResize );
    
    // const loader = new XYZLoader();
    // loader.load( '../.'+scanUrl, function ( geometry ){
    //     geometry.center();
    //     const vertexColors = ( geometry.hasAttribute( 'color' ) === true );
    //     const material = new THREE.PointsMaterial( { size: 0.2, vertexColors: vertexColors } );

    //     points = new THREE.Points( geometry, material );
        
    //     scene.add( points );
    //     zoomInTimeline(points.position.x, points.position.y, points.position.z, 10);
    // })
    
    var mapContainer = document.getElementById('map');

 
    proj4.defs('EPSG:32630', '+proj=utm +zone=30 +datum=WGS84 +units=m +no_defs +type=crs ');
    ol.proj.proj4.register(proj4);

    // Create the map
    const map = new ol.Map({
        view: new ol.View({
            projection: 'EPSG:32630',
            center: ol.proj.fromLonLat([10, 33]), // Set the initial center coordinates
            zoom: 7 // Set the initial zoom level
        }),
        target: mapContainer
    });
    const ImageSat = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
        }),
        visible: false,
        title:"ImageSat",
      })
    //   map.addLayer(ImageSat)
      
      const OSMStandard = new ol.layer.Tile({
        source: new ol.source.OSM({
        }),
        visible: true,
        title:"OSMStandard",
      })
    //   map.addLayer(OSMStandard) 

    const imgTiff = new ol.layer.Image({
        title:'Carte',
        source: new ol.source.ImageWMS({
            url:'http://localhost:8080/geoserver/cite/wms?service=WMS',
            params:{'LAYERS':'cite:image','TILED':true},
            serverType:'geoserver',
            
        }), 
        visible: false     
      })
    //   map.addLayer(imgTiff) 

      const baseLayers = new ol.layer.Group({
        title:'Base Maps',
        fold:true,
        layers:[OSMStandard,ImageSat,imgTiff]
    });

    map.addLayer(baseLayers);

    var redStyle = new ol.style.Style({
            image: new ol.style.Icon({
              anchor: [0.5, 1],
              src: 'http://maps.google.com/mapfiles/kml/paddle/red-circle.png',
              scale: 0.5
            })
    })
    var blueStyle = new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 1],
          src: 'http://maps.google.com/mapfiles/kml/paddle/blu-circle.png',
          scale: 0.5
        })
    })

    var vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            url: '../.'+folderName+'/file.json',
            format: new ol.format.GeoJSON({ dataProjection:'EPSG:32630' ,featureProjection: 'EPSG:32630' }),
        }),
        style:function(feature, resolution) {
            if (feature.getProperties().id == id) {
                return blueStyle;
            }
            else {
                return redStyle;
            }
        },
        name:'points',
        title:'points'
      });
      map.addLayer(vectorLayer);
      
    const vectorSource  = vectorLayer.getSource()
    vectorSource.on('change', function() {
        map.getView().fit(vectorSource.getExtent() ,{ duration: 1000 });
        const features = vectorSource.getFeatures()
    });
      
    function zoomToClickedPoint(evt){
        var pixel = map.getEventPixel(evt.originalEvent)
        var feature = map.forEachFeatureAtPixel(pixel,function(feat){
          return feat;
        })
        console.log(feature.getProperties())
        map.getView().animate({center:feature.getGeometry().getCoordinates(),zoom:19, duration: 1500 })
      }
      map.on('singleclick', zoomToClickedPoint)
    
function rotateVectorX(vector, theta) {
    var y = vector.y;
    var z = vector.z;
    vector.y = y * Math.cos(theta) - z * Math.sin(theta);
    vector.z = y * Math.sin(theta) + z * Math.cos(theta);
}

// Function to rotate a vector around the y-axis
function rotateVectorY(vector, theta) {
    var x = vector.x;
    var z = vector.z;
    vector.x = x * Math.cos(theta) + z * Math.sin(theta);
    vector.z = -x * Math.sin(theta) + z * Math.cos(theta);
}

// Function to rotate a vector around the z-axis
function rotateVectorZ(vector, theta) {
    var x = vector.x;
    var y = vector.y;
    vector.x = x * Math.cos(theta) - y * Math.sin(theta);
    vector.y = x * Math.sin(theta) + y * Math.cos(theta);
}

// Function to transform coordinates with arbitrary angles
function transformCoordinates(x, y, z, thetaX, thetaY, thetaZ) {
    var vector = new THREE.Vector3(x, y, z);
    rotateVectorX(vector, thetaX);
    rotateVectorY(vector, thetaY);
    rotateVectorZ(vector, thetaZ);
    return vector;
}
    var vrMode = false
    function createInfospots(id_proj,position,rotaton,arr){
        arr.forEach((item)=>{
            var dx = item['coordinates'][0] - position[0];
            var dy = item['coordinates'][1] - position[1];
            var dz = item['coordinates'][2] - position[2];
            var spritePos = transformCoordinates(dx, dy, dz, 0, 0, -(Math.PI+rotaton[2]*Math.PI/180));
            let new_infospot = new PANOLENS.Infospot(200, PANOLENS.DataImage.Arrow);
            new_infospot.position.set(100*spritePos.x, 100*spritePos.z, 100*spritePos.y);
            new_infospot.addEventListener('click', function () {
                console.log('http://'+window.location.href.split('/')[2]+'/project/'+id_proj+'/'+item['id']+'?x='+new_infospot.position.x+'&y='+new_infospot.position.y+'&z='+new_infospot.position.z+'&vr='+vrMode)
                window.location.href = 'http://'+window.location.href.split('/')[2]+'/project/'+id_proj+'/'+item['id']+'?x='+new_infospot.position.x+'&y='+new_infospot.position.y+'&z='+new_infospot.position.z+'&vr='+vrMode;              
            });
            panoramaImage.add(new_infospot);
        })
    }

    function createInfoBox(data,position){
        const boxDiv = document.createElement( 'div' );
        boxDiv.className = 'informationDiv';
        boxDiv.id = 'box'+data.id;

        const boxCloser = document.createElement( 'a' );
        boxCloser.id="box-closer" 
        boxCloser.className="boxCloser"
        boxCloser.style.pointerEvents = 'auto'
        boxCloser.addEventListener('pointerdown', () => {
            boxCloser.parentElement.style.visibility = 'hidden'
        })

        const objImg = document.createElement( 'div' );
        objImg.className = 'objImg';
        objImg.style.backgroundImage = 'url("../../static/icons/'+data.imgName+'")'

        const objInfo = document.createElement( 'div' );
        objInfo.className = 'objInfo';

        const objId = document.createElement( 'h3' );
        objId.className = 'objId';
        objId.textContent = data.id;

        const objName = document.createElement( 'h4' );
        objName.className = 'objName';
        objName.textContent = data.name;

        const objDesc = document.createElement( 'p' );
        objDesc.className = 'objDesc';
        objDesc.textContent = data.description;
        
        objInfo.appendChild(objId)
        objInfo.appendChild(objName)
        objInfo.appendChild(objDesc)

        boxDiv.appendChild(boxCloser)
        boxDiv.appendChild(objImg)
        boxDiv.appendChild(objInfo)
        const label = new CSS2DObject( boxDiv );
        label.position.set(position[0],position[1],position[2]);
        
        return label
    }

    function createObjects(arr){
        arr.forEach((item)=>{
            var geom = new window.THREE.Geometry();
            var points = item['points']
            var center = [0,0,0]
            for ( var i = 0; i< points.length; i++) {
                geom.vertices.push(new window.THREE.Vector3(points[i][0],points[i][1],points[i][2])); 
                center[0] = center[0]+points[i][0]/points.length
                center[1] = center[1]+points[i][1]/points.length
                center[2] = center[2]+points[i][2]/points.length
            }
            for ( var i = 0; i< points.length-2; i++) {
                geom.faces.push( new window.THREE.Face3(0,i+1,i+2)); 
            }
            geom.computeFaceNormals();

            var object = new window.THREE.Mesh( geom, new window.THREE.MeshBasicMaterial({ color: 0xffff00, side: window.THREE.DoubleSide,opacity : 0.4  }) );
            object.material.opacity = 0;
            object.material.transparenitemt = true;
            object.material.transparent = true;
            object.userData.id = item['id'];
            object.userData.name = item['name'];
            object.userData.description = item['description'];
            object.userData.imgName = item['imgName'];
            group.add( object );  
            const box = createInfoBox(object.userData,center)
            box.element.style.visibility = 'hidden'
            box.element.style.pointerEvents = 'auto'
            // box.element.addEventListener('pointerdown', () => { alert(1) })
            viewer.scene.add(box)
        })
    }

    const panoramaImage = new PANOLENS.ImagePanorama('../.'+imageUrl);
    panoramaImage.name = 'panoramaImage';
    const panoramaImageColor = new PANOLENS.ImagePanorama('../.'+imageColor);
    panoramaImageColor.name = 'panoramaImageColor';
    
    viewer = new PANOLENS.Viewer({
        container: main3D,
        dwellTime:1500,
    });
    
    viewer.add(panoramaImage,panoramaImageColor);
    viewer.addUpdateCallback(function(){});
    viewer.animate()

    viewer.OrbitControls.minFov= 5;
    viewer.OrbitControls.maxFov= 150;

    const panocanvas = $('.threed .panolens-canvas');
    panocanvas[0].style.width = '100%';
    panocanvas[0].style.height = '100%';
    main3D.appendChild( labelRenderer.domElement );
    
    const parameters = new URLSearchParams(window.location.search);
    console.log(parameters)
    if(parameters.get("x")){
        viewer.tweenControlCenter( new THREE.Vector3(parseFloat(parameters.get("x")), parseFloat(parameters.get("y")), parseFloat(parameters.get("z"))), 2 );        
    }
    else if (parameters.get("start")){[[[22                                                                                                                                                                                 ]]]
        console.log('start little planet')
        viewer.camera.position.set(0,4000,0)
        viewer.setCameraFov(160)
        let tl = gsap
            .timeline({ defaults: { duration: 3, ease: "expo.out" ,delay: 2} })
            .to(viewer.camera.position, { x:0, y:0, z:0})
            setTimeout(()=>{
                viewer.tweenControlCenter( new THREE.Vector3(-5000,1000,5000), 2 );
                viewer.setCameraFov(60)
            },3000)
    }
    if(parameters.get("vr") == "true"){
        console.log(parameters.get("vr"))
        console.log($('.toolbar #vr'))
        $('.toolbar #vr').on('click',function(){
            vrMode = true
            // viewer.enableControl( PANOLENS.CONTROLS.DEVICEORIENTATION );
            viewer.enableEffect(2)
            // $('.main .toolbar')[0].classList.add('activated')
            $('.navbar')[0].classList.add('activated')
            $('.mapContainer')[0].classList.add('activated')
            $('.main .toolbar')[0].style.display = 'none'
            $('.navbar')[0].style.display = 'none'
            $('.mapContainer')[0].style.display = 'none'
            $('.main .disableCardboard')[0].style.display = 'block'
        })
        setTimeout(function(){
            $('.toolbar #vr').trigger("click");
            window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
        },2000)
        
        
    }
    else{
        console.log('noooooo vr')
    }
    
    // panoramaImage.addEventListener( 'enter-fade-start', function(){
    //         const parameters = new URLSearchParams(window.location.search);
    //         if(parameters.get("x")){
    //             viewer.tweenControlCenter( new THREE.Vector3(parseFloat(parameters.get("x")), parseFloat(parameters.get("y")), parseFloat(parameters.get("z"))), 2 );        
    //         }
    //         else if (parameters.get("start")){
    //             console.log('start little planet')
    //             viewer.camera.position.set(0,4000,0)
    //             viewer.setCameraFov(160)
    //             let tl = gsap
    //                 .timeline({ defaults: { duration: 3, ease: "expo.out" ,delay: 1} })
    //                 .to(viewer.camera.position, { x:0, y:0, z:0})
    //                 setTimeout(()=>{
    //                     viewer.tweenControlCenter( new THREE.Vector3(-5000,1000,5000), 2 );
    //                     viewer.setCameraFov(60)
    //                 },3000)
                    
    //             // var threeChildrenBar = $('.main .threed')[0].children[4]
    //             // console.log(threeChildrenBar)
    //             // threeChildrenBar.style.position = 'absolute';
    //             // threeChildrenBar.style.zIndex = 30;
    //             // threeChildrenBar.style.bottom = '0%';
    //             // threeChildrenBar.style.right = '10%';
                
  
  
 
                   
    //         }
            
    // });

    const group = new window.THREE.Group();
    viewer.scene.add(group);
    

    panoramaImage.addEventListener('load', function(e){
        $.ajax({
            type: 'POST',
            url: '/infospots',
            timeout: 0,
            contentType: "application/json",
            dataType: 'json',
            success: function(data) {
                createInfospots(data['id'],imagePos,imageRot,data['infospots'])
            },
      
            error: function(e) {
              console.log('Failuuuuure!!')
              console.log("ERROR : ", e.responseText);
              alert("ERROR : " + e.responseText);
            }
        });
        $.ajax({
            type: 'POST',
            url: '/objects',
            timeout: 0,
            contentType: "application/json",
            dataType: 'json',
            success: function(data) {
                // console.log("SUCCESS !!: ", data);
                createObjects(data['objects'])
            },
      
            error: function(e) {
              console.log('Failuuuuure!!')
              console.log("ERROR : ", e.responseText);
              alert("ERROR : " + e.responseText);
            }
        });
        // $.ajax({
        //     type: 'POST',
        //     url: '/ObjectFilter',
        //     timeout: 0,
        //     contentType: "application/json",
        //     dataType: 'json',
        //     success: function(data) {
        //         console.log(data)
        //     },
      
        //     error: function(e) {
        //       console.log('Failuuuuure!!')
        //       console.log("ERROR : ", e.responseText);
        //       alert("ERROR : " + e.responseText);
        //     }
        // });
        
    });

    
    


    //////////////////////////////
    function setFov(){
        viewer.setCameraFov(60) 
    }
    function zoomToCenter(){
        let tl = gsap
            .timeline({ defaults: { duration: 3, ease: "expo.in" ,delay: 1} })
            .to(viewer.camera.position, { x:0, y:0, z:0 })
            // .to(viewer.camera, { fov:60})
            .call(setFov,6)
            
            
    };
    
    

      

    ///////////////////////////////

    const fullscreen = $('.toolbar #fullscreen');
    // fullscreen[0].addEventListener('touchstart', () => {
    fullscreen[0].addEventListener('click', () => {
        console.log('fullllll')
            const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement
        
            if (!fullscreenElement) {
                if (panocanvas[0].requestFullscreen) {
                    panocanvas[0].requestFullscreen()
                }
                else if (panocanvas[0].webkitRequestFullscreen) {
                    panocanvas[0].webkitRequestFullscreen()
                }
            }
            else {
                if (panocanvas[0].exitFullscreen) {
                    panocanvas[0].exitFullscreen()
                }
                else if (panocanvas[0].webkitExitFullscreen) {
                    panocanvas[0].webkitExitFullscreen()
                }
                panocanvas[0].style.width = '100%';
                panocanvas[0].style.height = '100%';
            }
    })

    const panorama = $('.toolbar #panorama');
    const panoInfo = $('.toolbar #information');
    // panorama.on('touchend', () => {
    panorama.on('click', () => {
        if(viewer.panorama.name === 'panoramaImage'){
            viewer.setPanorama(panoramaImageColor)
        }
        else{
            viewer.setPanorama(panoramaImage) 
        }
    })

    const popup = $('.popup')[0]
    const popupCloser = $('.popupCloser')
    const popupX = $('.popup .content .x')[0]
    const popupY = $('.popup .content .y')[0]
    const popupZ = $('.popup .content .z')[0]
    const popupD = $('.popup .content .distance')[0]

    popupCloser.on('click',function(){
        popup.style.display = 'none';
    })
    
    function createPositionPopup(){
                const popupDiv = document.createElement( 'div' );
                popupDiv.className = 'popup';
                popupDiv.id = 'popup';
                popupDiv.style.visibility = 'hidden'
                popupDiv.style.pointerEvents = 'auto'

                const popupCloser = document.createElement( 'a' );
                popupCloser.className = 'popupCloser';
                popupCloser.id = 'popup-closer';
                popupCloser.style.pointerEvents = 'auto'
                popupCloser.addEventListener('pointerdown', () => {
                    popupCloser.parentElement.style.visibility = 'hidden'
                })

                const popupContent = document.createElement( 'div' );
                popupContent.className = 'content'

                const xp = document.createElement( 'p' );
                xp.className = 'x'
                xp.innerHTML = '<span>X = </span>No data'
                const yp = document.createElement( 'p' );
                yp.className = 'y'
                yp.innerHTML = '<span>Y = </span>No data'
                const zp = document.createElement( 'p' );
                zp.className = 'z'
                zp.innerHTML = '<span>Z = </span>No data'
                const distp = document.createElement( 'p' );
                distp.className = 'distance'
                distp.innerHTML = '<span>Distance = </span>No data'

                popupContent.appendChild(xp)
                popupContent.appendChild(yp)
                popupContent.appendChild(zp)
                popupContent.appendChild(distp)

                popupDiv.appendChild(popupCloser)
                popupDiv.appendChild(popupContent)

                const ppp = new CSS2DObject( popupDiv );
                return ppp
    }
    const ppp = createPositionPopup()
    viewer.scene.add(ppp)

    const errorNot = $('.main .error')
    let rayCaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    function positionEvent(event){
        
                mouse.x =((event.clientX-viewer.renderer.domElement.offsetLeft)/viewer.renderer.domElement.width)*2-1;
                mouse.y =-((event.clientY-viewer.renderer.domElement.offsetTop)/viewer.renderer.domElement.height)*2+1;
                rayCaster.setFromCamera(mouse, viewer.camera);
                let intersections = rayCaster.intersectObject(panoramaImage);
                const uv = intersections[0].uv;
                
                viewer.scene.add(ppp)
                $.ajax({
                    type: 'POST',
                    url: '/coordinates',
                    data: JSON.stringify(uv),
                    timeout: 0,
                    contentType: "application/json",
                    dataType: 'json',
              
                    success: function(data) {
                        // console.log("SUCCESS !!: ", data);
                        ppp.element.children[1].children[0].lastChild.data = data['coordinates'][0]
                        ppp.element.children[1].children[1].lastChild.data = data['coordinates'][1]
                        ppp.element.children[1].children[2].lastChild.data = data['coordinates'][2]
                        ppp.element.children[1].children[3].lastChild.data = data['distance']
                        ppp.position.set(intersections[0].point.x,intersections[0].point.y,intersections[0].point.z)
                        ppp.element.style.visibility = 'visible'
                    },
              
                    error: function(e) {
                      errorNot[0].style.visibility = 'visible'
                      errorNot[0].style.opacity = 1
                      setTimeout(()=>{
                        errorNot[0].style.opacity = 0
                        errorNot[0].style.visibility = 'hidden'
                      },2000)
                    }
                });
        
                panocanvas.off("click")  
                panocanvas[0].style.cursor = 'default'    
    }

    
    const positionClick = $('.toolbar #position')
    positionClick.on('click',function(){
        if(positionClick[0].classList.contains('activate')== false){
            panocanvas.on("click",(evt)=>positionEvent(evt)) 
            panocanvas[0].style.cursor = 'crosshair'    
        }
        else{
            positionClick[0].classList.remove('activate');
            panocanvas.off("click")  
            panocanvas[0].style.cursor = 'default' 
        }
    })

    function getCenter(vectorA, vectorB){
        var center = new THREE.Vector3((vectorA.x+vectorB.x)/2,(vectorA.y+vectorB.y)/2,(vectorA.z+vectorB.z)/2)
        return center
    }

    function getText(dist,vector){
        const textDiv = document.createElement( 'div' );
        textDiv.className = 'measurementLabel';
        textDiv.visible = true;

        const dh = document.createElement( 'p' );
        dh.className = 'dh';
        dh.textContent = 'DH = '+dist.DH+'m';

        const di = document.createElement( 'p' );
        di.className = 'di';
        di.textContent = 'DI = '+dist.DI+'m';

        const dz = document.createElement( 'p' );
        dz.className = 'dz';
        dz.textContent = 'DZ = '+dist.DZ+'m';

        textDiv.appendChild(dh)
        textDiv.appendChild(di)
        textDiv.appendChild(dz)
        
        const label = new CSS2DObject( textDiv );
        label.position.set(vector.x,vector.y,vector.z);
        
        return label
    }

    function getPoint(vector){
        var marker = new window.THREE.Mesh( 
            new window.THREE.SphereGeometry( 30, 40, 40 ),
            new window.THREE.MeshBasicMaterial( { color: 0x141E46 } ) 
        );
        marker.position.set(vector.x,vector.y,vector.z);
        return marker
    }

    function getLine( vectorA, vectorB ) {
        var geometry = new window.THREE.Geometry();
        geometry.vertices.push(vectorA);
        geometry.vertices.push(vectorB);
        var material = new window.THREE.LineBasicMaterial({ 
            color: 0xFFFFFF ,
            linewidth:4});
        var line = new window.THREE.Line(geometry, material, window.THREE.LineSegments );
            return line;
    }
    
    const distanceClick = $('.toolbar #distance')
    distanceClick.on('click',function(){
        if(distanceClick[0].classList.contains('activate')== false){
            let countClick = 0;
            var clickPointsXYZ = [];
            var clickPointsUV = [];
            panocanvas[0].style.cursor = 'crosshair' 
            panocanvas.on("click",(event)=>{
                countClick += 1;
                mouse.x =((event.clientX-viewer.renderer.domElement.offsetLeft)/viewer.renderer.domElement.width)*2-1;
                mouse.y =-((event.clientY-viewer.renderer.domElement.offsetTop)/viewer.renderer.domElement.height)*2+1;
                rayCaster.setFromCamera(mouse, viewer.camera);
                let intersections = rayCaster.intersectObject(panoramaImage);
                clickPointsXYZ.push(intersections[0].point);
                clickPointsUV.push(intersections[0].uv);
                var marker = getPoint(intersections[0].point);
                viewer.scene.add(marker);
        
                switch(countClick){
                    case 1:{
                        console.log('add the second point')
                        break;
                    }
                    case 2:{
                        var line = getLine(clickPointsXYZ[0],clickPointsXYZ[1])
                        viewer.scene.add(line)
        
                        $.ajax({
                            type: 'POST',
                            url: '/distance',
                            data: JSON.stringify(clickPointsUV),
                            timeout: 0,
                            contentType: "application/json",
                            dataType: 'json',
                      
                            success: function(data) {
                                console.log("SUCCESS !!: ", data);
                                var centerVect = getCenter(clickPointsXYZ[0],clickPointsXYZ[1])
                                var text = getText(data.distance,centerVect)
                                viewer.scene.add(text)
                                clickPointsXYZ = []
                                clickPointsUV = []
                                countClick = 0;
                                // deleteElements = setTimeout(()=>{
                                //     viewer.scene.children.splice(viewer.scene.children.length - 4,4)
                                //     console.log(viewer.scene.children)
                                //     $('#labelObject')[0].innerHTML = ''
                                //     distanceClick[0].classList.remove('activate');
                                // },5000)
                                
                            },
                      
                            error: function(e) {
                              console.log('Failuuuuure!!')
                              console.log("ERROR : ", e.responseText);
                              alert("ERROR : " + e.responseText);
                            }
                        });
                        
                        panocanvas.off("click")
                        panocanvas[0].style.cursor = 'default' 
                        break;
                    }
                }
                
            })
        }
        else{
            // clearTimeout(deleteElements);
            // distanceClick[0].classList.remove('activate');
            panocanvas.off("click")
            console.log( viewer.scene.children)
            // viewer.scene.children.splice(viewer.scene.children.length - 4,4)
            $('#labelObject')[0].innerHTML = ''
        }
    })

    
    const zoomBtn = $('.toolbar #zoomToLayer')
    zoomBtn.on('click',function(){
        map.getView().fit(vectorSource.getExtent() ,{ duration: 1000 });
    })

    const mapBox = $('.mapContainer')
    const disableMapBtn = $('.toolbar #disactivateMap')
    disableMapBtn.on('click',function(){
        if(disableMapBtn[0].classList.contains('fa-eye')){
            console.log(disableMapBtn[0].classList)
            disableMapBtn[0].classList.remove('fa-eye')
            disableMapBtn[0].classList.add('fa-eye-slash')
            mapBox[0].style.opacity = 0
            mapBox[0].style.visibility = 'hidden'
        }
        else{
            disableMapBtn[0].classList.remove('fa-eye-slash')
            disableMapBtn[0].classList.add('fa-eye')
            mapBox[0].style.visibility = 'visible'
            mapBox[0].style.opacity = 1
            
        }
        
    })


    const infoClick = $('.toolbar #information')
    infoClick.on('click',function(){
            if(infoClick[0].classList.contains('activate')== false){
                infoClick[0].classList.add('activate');
                panocanvas.on("click",function(event){
                    mouse.x =((event.clientX-viewer.renderer.domElement.offsetLeft)/viewer.renderer.domElement.width)*2-1;
                    mouse.y =-((event.clientY-viewer.renderer.domElement.offsetTop)/viewer.renderer.domElement.height)*2+1;
                    rayCaster.setFromCamera(mouse, viewer.camera);
                    let intersections = rayCaster.intersectObject(group);
                    var objId = intersections[0].object.userData.id
                    var objClicked = document.getElementById('box'+objId)
                    objClicked.style.visibility = 'visible'
                    labelRenderer.domElement.style.pointerEvents = 'click';
                })            
            }
            else{
                infoClick[0].classList.remove('activate');
                panocanvas.off("click")  
            }
    })

    var mapCount = 0; 
    const changeMapBtn = $('.toolbar #carte')
    changeMapBtn.on('click',function(){
        map.getLayers().getArray()[0].getLayersArray()[mapCount].setVisible(false)
        if(mapCount === map.getLayers().getArray()[0].getLayersArray().length - 1 ){
            mapCount = 0;
        }
        else{
            mapCount += 1;
            
        }
        setTimeout(()=>{
            map.getLayers().getArray()[0].getLayersArray()[mapCount].setVisible(true)
        },50)        
    })
    
    const returnBtn = $('.returnMap')
    returnBtn.on('click',function(){
        window.location.href = 'http://127.0.0.1:5000/map'
    })


    const myProfileBtn = $('.navbar .navbarContainer .account .profileInfo')
    const profileList = $('.navbar .navbarContainer .account .profileList')
    myProfileBtn.on('click',function(e){
        if(profileList[0].classList.contains('activated')){
            profileList[0].classList.remove('activated')
        }
        else{
            profileList[0].classList.add('activated')
        }
    })




    const title = $('.navbar .title')
    title.on('click',function(){
        window.location.href = 'http://127.0.0.1:5000/';
    })

    // console.log(screen.orientation)
    // screen.orientation.lock('landscape-primary');
    // screen.orientation.addEventListener("change", () => {
    //     console.log(`The orientation of the screen is: ${screen.orientation}`);
    //     console.log(screen.orientation)

    // });

    var controlIndex = PANOLENS.CONTROLS.ORBIT;
    var modeIndex = 1; 
    

    const modeVR = $('.toolbar #vr')
    modeVR.on('touchstart',function(){
    // modeVR.on('click',function(){
        vrMode = true
        console.log('clicked vr')
        viewer.enableControl( PANOLENS.CONTROLS.DEVICEORIENTATION );
        // viewer.enableReticleControl()
        viewer.enableEffect(2)
        // $('.main .toolbar')[0].classList.add('activated')
        $('.navbar')[0].classList.add('activated')
        $('.mapContainer')[0].classList.add('activated')
        $('.main .toolbar')[0].style.display = 'none'
        $('.navbar')[0].style.display = 'none'
        $('.mapContainer')[0].style.display = 'none'
        $('.main .disableCardboard')[0].style.display = 'block'
        $('.toolbar #fullscreen').trigger("click");
          
    })

    const cancelModeVR = $('.main .disableCardboard hr')
    cancelModeVR.on('touchstart',function(){
    // cancelModeVR.on('click',function(){
        vrMode = false
        viewer.enableEffect(1)
        $('.main .disableCardboard')[0].style.display = 'none'
        $('.main .toolbar')[0].style.display = 'flex'
        $('.navbar')[0].style.display = 'block'
        $('.mapContainer')[0].style.display = 'block'
    })


   














































































}
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

    requestAnimationFrame( animate );

    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

    render();

}

function render() {

    renderer.render( scene, camera );
    labelRenderer.render( viewer.scene, viewer.camera );
}












