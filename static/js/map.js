

window.onload = init
function init(){
  // Get a reference to the map container
 var mapContainer = document.getElementById('map');


 
 
proj4.defs('EPSG:32630', '+proj=utm +zone=30 +datum=WGS84 +units=m +no_defs +type=crs ');
ol.proj.proj4.register(proj4);

 // Create the map
 const map = new ol.Map({
  loadTilesWhileAnimating: false,
  loadTilesWhileInteracting:false,
   view: new ol.View({
    projection: 'EPSG:32630',
    // center: ol.extent.getCenter(extent),
     center: ol.proj.fromLonLat([10, 33]), // Set the initial center coordinates
     zoom: 7 // Set the initial zoom level
   }),
   target: mapContainer
 });

 // Layers
 const ImageSat = new ol.layer.Tile({
  source: new ol.source.XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
  }),
  visible: true,
  title:"ImageSat",
})
map.addLayer(ImageSat)

const OSMStandard = new ol.layer.Tile({
  source: new ol.source.OSM({
  }),
  visible: false,
  title:"OSMStandard",
})
map.addLayer(OSMStandard) 
 
const imgTiff = new ol.layer.Image({
  title:'Carte',
  source: new ol.source.ImageWMS({
      url:'http://localhost:8080/geoserver/cite/wms?service=WMS',
      params:{'LAYERS':'cite:image','TILED':true},
      serverType:'geoserver',
      
  }),  
  visible: false    
})
map.addLayer(imgTiff) 

// var bbox = image.getBoundingBox();
// map.getView().fit(bbox ,{ duration: 1000 });

 // Switcher Control
//  var switcher = new ol.control.LayerSwitcher({
//   activationMode: 'click',
//   startActive: false,
//   groupSelectStyle: 'children'
// })
// map.addControl(switcher)

//  var mousePosition = new ol.control.MousePosition({
//   className:'mousePosition',
//   projection:'EPSG:32630',
//   coordinateFormat: function(coordinate){return ol.coordinate.format(coordinate, '{x}   {y}', 4);}
// })
// map.addControl(mousePosition)

 //Fullscreen control 
 var fullScreen = new ol.control.FullScreen()
 map.addControl(fullScreen)

 const styles = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'blue',
      width: 3,
    }),
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 255, 0.1)',
    }),
  }),
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: 10,
      fill: new ol.style.Fill({
        color: 'red',
      }),
    }),
  }),
];

 var vectorLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
      url: '../../static/projects/all.json',
      format: new ol.format.GeoJSON({ dataProjection:'EPSG:32630' ,featureProjection: 'EPSG:32630' }),
  }),
  style: styles,
  name:'points',
  title:'points'
});
map.addLayer(vectorLayer);

var scansLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 1],
      src: '../../static/icons/location(1).png',
      scale: 0.05
    })
  }),
  name:'scans',
  title:'scans'
});
map.addLayer(scansLayer);

var markers = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 1],
      src: '../../static/icons/location(1).png',
      scale: 0.05
    })
  })
});
map.addLayer(markers);

var marker = new ol.Feature(new ol.geom.Point([742678.5,3971501.491]));

const vectorSource  = vectorLayer.getSource()
vectorSource.on('change', function() {
  console.log(vectorSource.getFeatures());
});
vectorLayer.setOpacity(0.5);



const sidebar = document.body.getElementsByClassName('sidebar');
// Zoom to clicked point
function zoomToClickedPoint(evt){
  var pixel = map.getEventPixel(evt.originalEvent)
  var feature = map.forEachFeatureAtPixel(pixel,function(feat){
    return feat;
  })
  console.log(feature.getProperties()['name'])
  var titles = $('.infoProject h3')
  var j = 1
  for (let i=0;i<titles.length;i++){
    var projectElem = titles[i].parentElement.parentElement.parentElement.parentElement
    var infoActive = titles[i].parentElement.nextElementSibling.children[0]
    if(titles[i].innerText == feature.getProperties()['name']){
      if(projectElem.classList.contains('activated') == false){
        projectElem.classList.add('activated')

      }
      titles[i].parentElement.parentElement.parentElement.parentElement.style.order = 0 
      titles[i].parentElement.parentElement.parentElement.parentElement.style.border = '4px solid #c7a900'  
    }
    else{
      if(projectElem.classList.contains('activated')){
        projectElem.classList.remove('activated')
        
      }
      titles[i].parentElement.parentElement.parentElement.parentElement.style.border = '2px solid #0c122b'
      titles[i].parentElement.parentElement.parentElement.parentElement.style.order = j
      j += 1
    }
  }
  map.getView().animate({center:feature.getGeometry().getCoordinates(),zoom:19, duration: 1500 })
}
map.on('singleclick', zoomToClickedPoint)

// Start project

$(document).ready(function(){
  $(document).on('click','.container .sidebar .project #enterBtn',function(e){
      var id = e.target.parentElement.parentElement.parentElement.id
      console.log(e.target.parentElement.parentElement.parentElement)
      window.location.href = 'http://127.0.0.1:5000/project/'+id+'/0'+'?start=true';
      e.target.value = '';
  })
})

// info project
$(document).ready(function(){
  $(document).on('click','.container .sidebar .project #infoBtn',function(e){
      var projectElem = e.target.parentElement.parentElement.parentElement.parentElement
      if(projectElem.classList.contains('activated')){
        projectElem.classList.remove('activated')
      }
      else{
        projectElem.classList.add('activated')
      }
      e.target.value = '';
  })
})

// info project
$('.filterBar .filteringForm input').on('input',function(e){
    const form = new FormData(e.target.parentElement)
    var objForm = {};
    form.forEach(function(value, key){
      objForm[key] = value;
    });
    $.ajax({
      type: 'POST',
      url: '/filter',
      timeout: 0,
      data:JSON.stringify(objForm),
      contentType: "application/json",
      dataType: 'json',
      success: function(data) {
        // console.log("SUCCESS !!: ", data);
        var ids = []
        for (let i=0;i<data['project'].length;i++){
          ids.push(data['project'][i]['properties'].id)
        }
        var projects = $('.container .project')
        for (let i=0;i<projects.length;i++){
          if(ids.includes(Number(projects[i].children[0].id))){
            projects[i].style.display = 'block'
          }
          else{
            projects[i].style.display = 'none'
          }
        }
      },

  });
})

$('.filterBar .filteringForm .clear').on('click',function(){
  const inputs = $('.filterBar .filteringForm input')
  for (let i=0;i<inputs.length;i++){
    inputs[i].value = '';
    var projects = $('.container .project')
    for (let i=0;i<projects.length;i++){
      projects[i].style.display = 'block'
    }
  }
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








}

const projectsContainer = $('.container .sidebar')[0]

function loadProjects(arr){
  var index = 0
    arr['project'].forEach((item)=>{
      var divproject = document.createElement('div')
      divproject.className = 'project';

      var boxProject = document.createElement('div')
      boxProject.className = 'boxProject';
      boxProject.id = item['properties']['id'];
      boxProject.innerHTML = '<div class="infoProject"><div class="aboutProject"><h3>'+item['properties']['name']+'</h3><p>'+item['properties']['address']+'</p></div><div class="btnProject"><img class="imageIcon white" id="infoBtn" src="../../static/icons/circle-info-solid.svg" ><img class="imageIcon white" id="enterBtn" src="../../static/icons/play-solid.svg" ></div></div>'
      boxProject.style.backgroundImage = "url('"+item['properties']['img']+"')"

      var date = document.createElement('p');
      date.className = "date"
      date.innerHTML ='<span>Date :</span> '+item['properties']['date'];

      var address = document.createElement('p');
      address.className = "address"
      address.innerHTML ='<span>Address :</span> '+item['properties']['address'];

      var location = document.createElement('p');
      location.className = "location"
      location.innerHTML ='<span>Location :</span> ('+item['geometry']['coordinates'] +')';

      var type = document.createElement('p');
      type.className = "type"
      type.innerHTML ='<span>Type :</span> '+item['properties']['type'];

      var description = document.createElement('p');
      description.className = "description"
      description.innerHTML ='<span>Description :</span> '+item['properties']['description'];

      var divdescProject = document.createElement('div')
      divdescProject.className = 'descProject';

      divdescProject.appendChild(date)
      divdescProject.appendChild(address)
      divdescProject.appendChild(location)
      divdescProject.appendChild(type)
      divdescProject.appendChild(description)

      divproject.appendChild(boxProject)
      divproject.appendChild(divdescProject)
      projectsContainer.appendChild(divproject)
    })
}


window.addEventListener('load', function(e){
    $.ajax({
        type: 'POST',
        url: '/loadProjects',
        timeout: 0,
        contentType: "application/json",
        dataType: 'json',
        success: function(data) {
            loadProjects(data)
        },
  
        error: function(e) {
          console.log('Failuuuuure!!')
          console.log("ERROR : ", e.responseText);
          alert("ERROR : " + e.responseText);
        }
    });
});