$(document).ready( function () {
	$('#'+database+'Menu').addClass('active');
	
    // Shape the layout of the webpage
    var bodyheight = $(window).height();
    $("#mapBox").height(bodyheight-80);
    $(window).resize(function() {
	    bodyheight = $(window).height();
	    $("#mapBox").height(bodyheight-80);
	    setTimeout( function() { map.updateSize();}, 100);
    });


	function makeTable (tableDiv,data){
		this.data = data;
		this.tableBody = $(tableDiv);
		this.addRow = function (cells) {
			this.tableBody
				.append($('<tr>')
					.append($('<td>')
						.addClass('icon')
						//~ .append('<a class="btn btn-mini"><i class="icon-remove"></i></a>')
						.append($('<a/>')
							.click(function() {
								$(this).closest('tr').remove();
							})
							.addClass('btn btn-mini')
							.append($('<i>')
								.addClass('icon-remove')
							)
						)
					)
					.append($('<td>')
						.append($('<textarea></textarea>')
							//~ .attr('rows',2)
							//~ .attr('cols',20)
							.attr('placeholder','Nombre')
							.addClass('span12')
							.attr('value',cells[0])
						)
					)
					.append($('<td>')
						.append($('<textarea></textarea>')
							//~ .attr('rows',2)
							//~ .attr('cols',20)
							.attr('placeholder','Valor')
							.addClass('span12')
							.attr('value',cells[1])
						)
					)
				);
		};
		this.addRows = function (rows) {
			for (var i in rows) {
				this.addRow(rows[i]);
			};
		};
		this.getRows = function () {
			data = [];
			this.tableBody.find('tr').each(function() {
				inputBoxes = $(this).find('textarea');
				data.push([$(inputBoxes[0]).val(),$(inputBoxes[1]).val()]);
			});
			return data;
		};
		this.empty = function () {
			this.tableBody.empty();
		};
		this.addRows(data);
	};


	table1 = new makeTable('#tags',[]);

	initMap();
	
	function saveVectorLayer(){
		featuresString = format.write(vectorLayer.features,true);
		$('input#guardarMapa')
			.attr("disabled",'disabled')
			.attr("value",'Guardando Mapa...');
		$.ajax( {
			type: 'POST',
			dataType: 'json',
			data: {'action':'saveShapes','database':database,
				'features': featuresString
				},
			url:  cgiDir+'editor.py',
			success: function( result ) {
				setTimeout(function() {
					$('input#guardarMapa')
						.removeAttr("disabled")
						.attr("value","Guardar Polígonos");
				},1000);
				table1.empty();
                vectorLayer.refresh();
			}
		});
		return false;
	}



	//~ Botones para TAGS
	
	// Cargar lista de tags predeterminados
	$.ajax( {
		type: 'POST',
		dataType: 'json',
		data: {'action':'getCodes',
			'database':database},
		url:  cgiDir+'editor.py',
		success: function(savedTags) {
			$('select#savedTags').append($("<option />").text('Etiquetas predeterminadas'));
			for (var i in savedTags) {
				$('select#savedTags').append($("<option />").val(savedTags[i]).text(savedTags[i]));
			}
		}
	});

	$('select#savedTags').change(function(){
		var selectedCode = $('select#savedTags').find(":selected").val();
		$.ajax( {
			type: 'POST',
			dataType: 'json',
			data: {'action':'getSavedTag',
				'codigo':selectedCode,
                'database':database},
			url:  cgiDir+'editor.py',
			success: function( tags ) {
				$('#tags').empty();
			    for (var k in tags) {
					table1.addRow([k,tags[k]]);
				};
				
			}
		});
		return false;
	});


	$('input#newTag').click(function() {
		table1.addRow(['','']);
	});

	$('input#saveTags').click(function(){
		selectedShape = vectorLayer.selectedFeatures[0].fid;
        var data = {};
        $('#tags tr').each(function() {
			inputBoxes = $(this).find('textarea');
            data[$(inputBoxes[0]).val()] = $(inputBoxes[1]).val();
        });
        tags = JSON.stringify(data);
        $('input#saveTags')
			.attr("disabled",'disabled')
			.attr("value",'Guardando...');
		$.ajax( {
			type: 'POST',
			dataType: 'json',
			data: {'action':'saveTags',
                'database':database,
				'sid':selectedShape,
                'tags':tags},
			url:  cgiDir+'editor.py',
			success: function( result ) {
				setTimeout(function() {
					$('input#saveTags')
						.removeAttr("disabled")
						.attr("value","Guardar Etiquetas");
				},500);
			}
		});
		return false;
	});

	

	//~ Botones para editar los polígonos

	$('input#guardarMapa').click(function(){
		controls['poly'].deactivate();
		controls['modify'].deactivate();
		controls.select.activate();
		saveVectorLayer();
	});
	
	$('input#borrarPoligono').click(function(){
		selectedShape = vectorLayer.selectedFeatures[0].fid;
		$.ajax({
			type: 'POST',
			dataType: 'json',
			data: {'action':'removeShape','database':database,
				'sid':selectedShape},
			url:  cgiDir+'editor.py',
			success: function( result ) {
				vectorLayer.refresh();
				controls.select.unselectAll();
			}
		});
	});
	
	$(document).keydown(function (e) {
		var keycode = (e.keyCode ? e.keyCode : e.which);
		if (keycode == '27') {
			if (controls.poly.active) {
				controls.poly.finishSketch();
			} else if (controls.select.active) {
				controls.select.unselectAll();
			} else if (controls.modify.active) {
				controls.modify.unselectFeature();
				controls.select.unselectAll();
			}
		};
	});



});
