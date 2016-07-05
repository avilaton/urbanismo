var lonCenter = -64.1857371;
var latCenter = -31.4128832;
var zoom = 12;
var map, baselayer;

function initMap(){
	map = new OpenLayers.Map('map', {controls : [
		    new OpenLayers.Control.Navigation(),
		    new OpenLayers.Control.PanZoomBar(),
		    new OpenLayers.Control.LayerSwitcher({'ascending':false}),
		    new OpenLayers.Control.ScaleLine(),
		    new OpenLayers.Control.MousePosition({displayProjection: 
			new OpenLayers.Projection("EPSG:4326")}),
		    new OpenLayers.Control.Attribution()
		    ]
	    });
	baselayer = new OpenLayers.Layer.OSM( "OSM Map");
	// baselayer = new OpenLayers.Layer.OSM("Mosaico Local", 
	// 		"http://localhost:8005/${z}/${x}/${y}.png", {
	// 			numZoomLevels: 19, 
	// 			alpha: true, 
	// 			isBaseLayer: true
	// 		});

	map.addLayer(baselayer);
	if (typeof(google) === 'object') {
	    gmap = new OpenLayers.Layer.Google("Google Streets",{
		    numZoomLevels: 20,animationEnabled:false
		    });
	    map.addLayer(gmap);
	    gsat = new OpenLayers.Layer.Google("Google Satellite",{
		    type: google.maps.MapTypeId.SATELLITE,
		    numZoomLevels: 22,animationEnabled:false
		    });
	    map.addLayer(gsat);
	};

	
	map.setCenter(
		new OpenLayers.LonLat(lonCenter, latCenter).transform(
			new OpenLayers.Projection("EPSG:4326"),
			map.getProjectionObject()
		), zoom
	);    

    // barrios layer
    var overStyle = new OpenLayers.Style(
            {
                strokeColor: "black", strokeWidth: 6, strokeOpacity: 0.3, 
                pointRadius: 7, fillColor:"green", fill:false, 
                fillOpacity:0.3, strokeDashstyle: "solid",
                label : "${name}",
                fontColor: "black", fontSize: "15px", fontOpacity: 0.6,
                fontFamily: "Arial", fontWeight: "bold",
                labelAlign: "cc",labelOutlineColor: "white", labelOutlineWidth: 3
            },
            {
                rules: [
                    new OpenLayers.Rule({
                        minScaleDenominator: 200000000,
                        symbolizer: {
                            strokeOpacity: 0.8,
                            fontSize: "0px"
                        }
                    }),
                    new OpenLayers.Rule({
                        maxScaleDenominator: 200000000,
                        minScaleDenominator: 50000,
                        symbolizer: {
                            strokeOpacity:0.6,
                            fontSize: "8px"
                        }
                    }),
                    new OpenLayers.Rule({
                        maxScaleDenominator: 50000,
                        minScaleDenominator: 20000,
                        symbolizer: {
                            strokeWidth:12,
                            strokeOpacity: 0.4,
                            fontSize: "15px"
                        }
                    }),
                    new OpenLayers.Rule({
                        maxScaleDenominator: 20000,
                        symbolizer: {
                            strokeWidth:18,
                            strokeOpacity: 0.3,
                            fontSize: "30px"
                        }
                    })
                ]
    });
            
            
    var overStyleMap = new OpenLayers.StyleMap({'default':overStyle});

    barriosLayer = new OpenLayers.Layer.GML("Barrios", "data/barriosTitle.osm", {
				    format: OpenLayers.Format.OSM,
				    styleMap:overStyleMap,
				    visibility: false
			    });
    barriosLayer.id = 'barriosLayer';
	map.addLayer(barriosLayer);

    distritosLayer = new OpenLayers.Layer.GML("Distritos", "data/distritos.osm", {
				    format: OpenLayers.Format.OSM,
				    styleMap:overStyleMap,
				    visibility: false
			    });
    distritosLayer.id = 'distritosLayer';
	map.addLayer(distritosLayer);

    cpcLayer = new OpenLayers.Layer.GML("Zonas CPC", "data/cpc.osm", {
				    format: OpenLayers.Format.OSM,
				    styleMap:overStyleMap,
				    visibility: false
			    });
    cpcLayer.id = 'cpcLayer';
	map.addLayer(cpcLayer);


	var vectorStyleMap = new OpenLayers.StyleMap({
		'default': new OpenLayers.Style({strokeColor: "green", 
			strokeWidth: 2, strokeOpacity: 1, pointRadius: 2, 
			fillColor:"green", fill:true, fillOpacity:0.1}),
		'select': new OpenLayers.Style({strokeColor: "blue", 
			strokeWidth: 5, strokeOpacity: 0.6, pointRadius: 2, 
			fillColor:"blue", fill:true, fillOpacity:0.3})
	});
	vectorLayer = new OpenLayers.Layer.Vector("Vector Layer", {
		styleMap : vectorStyleMap,
		projection: new OpenLayers.Projection("EPSG:4326"),
		strategies: [new OpenLayers.Strategy.Fixed()],
		protocol: new OpenLayers.Protocol.HTTP({
					url: cgiDir+"editor.py?action=getShapes&database="+database,
			format: new OpenLayers.Format.GeoJSON()
		})
	});
	vectorLayer.id = 'vector';
	map.addLayer(vectorLayer);


    function setTags(event) {
        $.ajax({
        type: 'POST',
        dataType: 'json',
        data: {'action':'getTags',
            'database':database,
            'sid': event.feature.fid},
        url:  cgiDir+'editor.py',
        success: function( tags ) {
            for (var key in tags) {
                if (key.slice(0,4) == 'link') {
                    $("#tags").append('<dt>' + key.slice(5) + '</dt>');
                    $("#tags").append("<dd>Link : <a href='"+ tags[key] + "' target='_blank'>"+key.slice(5)+"</a></dd>");
                } else if (key == 'codigo') {
                } else {
                    $("#tags").append('<dt>' + key + '</dt>');
                    $("#tags").append('<dd>' + tags[key] + '</dd>');
                }
            };
            }
        });
    }
    function removeTags(event) {
            $('#tags').empty();
    }
    vectorLayer.events.on({
        "featureselected": setTags,
        "featureunselected": removeTags
    });


	controls = {
        select: new OpenLayers.Control.SelectFeature(
            vectorLayer,
            {
                clickout: true, toggle: true,
                multiple: false, hover: false
            }
        )
	};

    controls.select.handlers['feature'].stopDown = false;
    controls.select.handlers['feature'].stopUp = false;
    map.addControl(controls['select']);
    controls.select.activate();
    vectorLayer.events.fallThrough = true;

}


$(document).ready(function() {
    $('#'+database+'Menu').addClass('active');
    
    // Shape the layout of the webpage
    var bodyheight = $(window).height();
    $("#mapBox").height(bodyheight-110);
    $(window).resize(function() {
	    bodyheight = $(window).height();
	    $("#mapBox").height(bodyheight-110);
	    setTimeout( function() { map.updateSize();}, 200);
    });

    // Initialization code
    initMap();

    $('#capas :checkbox').click(function() {
            var layer = $(this)[0].value;
            if($(this).is(':checked')){
                map.getLayer(layer).setVisibility(true);
            } else {
                map.getLayer(layer).setVisibility(false);
            }
        }
    );

});
