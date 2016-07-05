#!/usr/bin/python

import ormgeneric.ormgeneric as o
import geojson
import json
import os

import cgi

form = cgi.FieldStorage()
action = form.getvalue('action')

def jsonPrint(data):
	print "Content-Type: application/json\n\n"
	print json.dumps(data,indent=1)

def getShapesList(db):
	db.query("""SELECT ALL sid FROM shape_id""")
	shapes = [str(row['sid']) for row in db.cursor.fetchall()]
	return shapes

def getShape(db,shape_id):
	result = db.select('shapes',id=shape_id)
	coordList = [[p['lon'],p['lat']] for p in result]
	feature = geojson.geoJsonLineString(shape_id,coordList)
	resultGeoJson = geojson.geoJsonFeatCollection([feature])
	return resultGeoJson

def main():
	database = form.getvalue('database')
	db = o.dbInterface(database+".sqlite")
	if action == 'getDb':
		FILENAME = database+".sqlite"
		with open(database+".sqlite", "r") as f:
			buff = f.read()
			print "Content-Type:application/x-download\n",
			print "Content-Disposition:attachment;filename={0}\n".format(os.path.split(database+".sqlite")[-1]),
			print "Content-Length:{0}\n".format(len(buff)),
			print "\n{0}".format(buff)
	elif action == 'getShapes':
		features = []
		for sid in getShapesList(db):
			routeShape = [[float(p['lon']),float(p['lat'])] for p in db.select('shapes',sid=sid)]
			feature = geojson.geoJsonPolygon(sid,[routeShape])
			#~ feature.update({'properties':{'test1':'test2'}})
			features.append(feature)
		featureCollection = geojson.geoJsonFeatCollection(features)
		jsonPrint(featureCollection)
	elif action == 'getTags':
		sid = form.getvalue('sid')
		#~ Dict comprehension incompatible with python version<2.6!!!
		#~ out = {k:v for _,k,v in db.select('shape_tags',sid=sid)}
		out = {}
		if sid <> 'null':
			for sid,k,v in db.select('shape_tags',sid=sid):
				if (k <> u'' and v <> u''):
					out.update({k:v})
		jsonPrint(out)
	elif action == 'getSavedTag':
		codigo = form.getvalue('codigo')
		row = db.select('codigos',codigo=codigo)[0]
		#~ Dict comprehension incompatible with python version<2.6!!!
		#~ out = {k:row[k] for k in row.keys()} 
		out = {}
		for k in row.keys():
			if (k and row[k] and k <> 'codigo'):
				out.update({k:row[k]})
		jsonPrint(out)
	elif action == 'getCodes':
		db.query('SELECT ALL codigo FROM codigos')
		out = [r[0] for r in db.cursor.fetchall()]
		jsonPrint(out)
	elif action == 'saveTags':
		sid = form.getvalue('sid')
		tags = json.loads(form.getvalue('tags'))
		db.remove('shape_tags',sid=sid)
		for k,v in tags.items():
			if (k <> u'' and v <> u''):
				db.insert('shape_tags',sid=sid,k=k,v=v)
		jsonPrint(tags)
	elif action == 'removeShape':
		sid = form.getvalue('sid')
		db.remove('shapes',sid=sid)
		db.remove('shape_id',sid=sid)
		db.remove('shape_tags',sid=sid)
		jsonPrint({'success':True})
	elif action == 'saveShapes':
		jData = json.loads(form.getvalue('features'))
		features = {}
		for feature in jData['features']:
			if feature['geometry']['type'] == 'Polygon':
				if 'id' in feature:
					features.update({feature['id']:feature['geometry']['coordinates'][0]})
				else:
					db.query("""INSERT INTO shape_id DEFAULT VALUES """)
					newid = db.cursor.lastrowid
					features.update({str(newid):feature['geometry']['coordinates'][0]})

		for sid,coordList in features.items():
			db.remove('shapes',sid=sid)
			#~ jsonPrint(coordList)
			for i,pt in enumerate(coordList):
				db.insert('shapes',sid=sid,
					lat=pt[1],
					lon=pt[0],
					seq=i+1)
		jsonPrint({'success':True})

	db.close()

if __name__ == "__main__":
	main()
