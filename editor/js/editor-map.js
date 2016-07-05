var lon = -64.1857371;
var lat = -31.4128832;
var zoom = 14;
var cgiDir = '/urbanismo/cgi-bin/';
var map, vectorLayer, controls,panel,format;
var table1;

var proj4326 = new OpenLayers.Projection("EPSG:4326");

function initMap(){
    // Base map setup
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

   var baselayer = new OpenLayers.Layer.OSM( "OSM Map");
   
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
	    new OpenLayers.LonLat(lon, lat).transform(
		    new OpenLayers.Projection("EPSG:4326"),
		    map.getProjectionObject()
	    ), zoom
    );
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.addControl(new OpenLayers.Control.Permalink());


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

    barriosLayer = new OpenLayers.Layer.GML("Barrios", "../data/barriosTitle.osm", {
				    format: OpenLayers.Format.OSM,
				    styleMap:overStyleMap,
				    visibility: false
			    });
    barriosLayer.id = 'barriosLayer';
	map.addLayer(barriosLayer);

    distritosLayer = new OpenLayers.Layer.GML("Distritos", "../data/distritos.osm", {
				    format: OpenLayers.Format.OSM,
				    styleMap:overStyleMap,
				    visibility: false
			    });
    distritosLayer.id = 'distritosLayer';
	map.addLayer(distritosLayer);

    cpcLayer = new OpenLayers.Layer.GML("Zonas CPC", "../data/cpc.osm", {
				    format: OpenLayers.Format.OSM,
				    styleMap:overStyleMap,
				    visibility: false
			    });
    cpcLayer.id = 'cpcLayer';
	map.addLayer(cpcLayer);










    var vectorStyleMap = new OpenLayers.StyleMap({
	    'default': new OpenLayers.Style({strokeColor: "green", 
		    strokeWidth: 2, strokeOpacity: 1, pointRadius: 4, 
		    fillColor:"green", fill:true, fillOpacity:0.2}),
	    'temporary': new OpenLayers.Style({strokeColor: "green", 
		    strokeWidth: 3, strokeOpacity: 0.6, pointRadius: 8, 
		    fillColor:"blue", fill:true, fillOpacity:0.5})
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
	table1.empty();
	$.ajax({
	    type: 'POST',
	    dataType: 'json',
	    data: {'action':'getTags',
		'database':database,
		'sid': event.feature.fid
	    },
	    url: cgiDir+'editor.py',
	    success: function(tags) {
		for (var k in tags) {
		    table1.addRow([k,tags[k]]);
		};
	    }
	});
    }
    function removeTags(event) {
		    table1.empty();
    }
    vectorLayer.events.on({
	    "featureselected": setTags,
	    "featureunselected": removeTags
    });


    controls = { 
	    poly : new OpenLayers.Control.DrawFeature(vectorLayer,
						    OpenLayers.Handler.Polygon),
	    modify: new OpenLayers.Control.ModifyFeature(vectorLayer),
	    select: new OpenLayers.Control.SelectFeature(vectorLayer,
		{clickout: true, toggle: true,
		multiple: false, hover: false
	    }),
	    snap: new OpenLayers.Control.Snapping({
		layer: vectorLayer,
		targets: [vectorLayer],
		greedy: false
	    })
    };
    controls.snap.activate();

    panel = new OpenLayers.Control.Panel({
		defaultControl:controls.select
	});

    controls.select.handlers['feature'].stopDown = false;
    controls.select.handlers['feature'].stopUp = false;

    vectorLayer.events.fallThrough = true;

    panel.addControls([controls.poly,controls.modify,controls.select]);
    map.addControl(panel);
    format = new OpenLayers.Format.GeoJSON({
		'internalProjection': map.baseLayer.projection,
		'externalProjection': proj4326
    });

}

