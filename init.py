from flask import Flask,render_template,request,jsonify,redirect,url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import  LoginManager,login_user, logout_user, login_required, current_user
from flask_user import roles_required, UserManager,UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from views import *
from werkzeug.utils import secure_filename
import re
import jmespath
import time
import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///file.db'
app.config["SECRET_KEY"] = "abc"

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USERNAME'] = 'email@example.com'
app.config['MAIL_PASSWORD'] = 'password'
app.config['MAIL_DEFAULT_SENDER'] = '"MyApp" <noreply@example.com>'

# Flask-User settings
app.config['USER_APP_NAME'] = "Flask-User Basic App"      # Shown in and email templates and page footers
app.config['USER_ENABLE_EMAIL'] = True        # Enable email authentication
app.config['USER_ENABLE_USERNAME'] = False    # Disable username authentication
app.config['USER_EMAIL_SENDER_NAME'] = app.config['USER_APP_NAME']
app.config['USER_EMAIL_SENDER_EMAIL'] = "noreply@example.com"
app.config['USER_LOGIN_TEMPLATE']= 'Auth/login.html'

db = SQLAlchemy()
 
login_manager = LoginManager()
login_manager.init_app(app)

class Users(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(250), unique=True, nullable=False)
    email = db.Column(db.String(250), unique=True, nullable=False)
    email_confirmed_at = db.Column(db.DateTime())
    password = db.Column(db.String(250), nullable=False)
    
    # Define the relationship to Role via UserRoles
    roles = db.relationship('Role', secondary='user_roles')


# Define the Role data-model
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(50), unique=True)

# Define the UserRoles association table
class UserRoles(db.Model):
    __tablename__ = 'user_roles'
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), db.ForeignKey('users.id', ondelete='CASCADE'))
    role_id = db.Column(db.Integer(), db.ForeignKey('roles.id', ondelete='CASCADE'))
db.init_app(app)
 
user_manager = UserManager(app, db, Users)

with app.app_context():
    db.create_all()
 
    if not Users.query.filter(Users.email == 'member@example.com').first():
        user = Users(
            email='member@example.com',
            email_confirmed_at=datetime.datetime.utcnow(),
            username='member',
            password=generate_password_hash('member', method='scrypt')
        )
        db.session.add(user)
        db.session.commit()

    if not Users.query.filter(Users.email == 'admin@example.com').first():
        user = Users(
            email='admin@example.com',
            email_confirmed_at=datetime.datetime.utcnow(),
            username='admin',
            password=generate_password_hash('admin', method='scrypt')
        )
        user.roles.append(Role(name='Admin'))
        user.roles.append(Role(name='Agent'))
        db.session.add(user)
        db.session.commit()
 
@login_manager.user_loader
def loader_user(user_id):
    return Users.query.get(user_id)
 
 
@app.route('/register', methods=["GET", "POST"])
def register():
    if request.method == "POST":
        user = Users.query.filter_by(
        username=request.form.get("username")).first()
        if(user):
            return render_template("Auth/login.html")
        else:
            user = Users(username=request.form.get("username"),
                        email=request.form.get("email"),
                        password=generate_password_hash(request.form.get("password"), method='scrypt'))
            db.session.add(user)
            db.session.commit()
            return render_template("Auth/login.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = Users.query.filter_by(
        username=request.form.get("username")).first()
        if(user):
            if check_password_hash(user.password, request.form.get("password")):
                login_user(user)
                if(user.username == 'admin'):
                    return redirect(url_for("admin"))
                return redirect(url_for("map"))
    return render_template("Auth/login.html")

@login_manager.unauthorized_handler     
def unauthorized_callback():          
       return render_template("Auth/login.html")
   
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("homePage"))

@app.route('/')
@app.route('/Home')
def homePage():
    global projectsFile
    projectsFile = json.load(open('./static/projects/all.json'))
    return render_template('Homepage.html')

@app.route('/map')
@login_required
def map():
    return render_template('User/map.html', name=current_user.username)

@app.route('/project/<int:id>/<int:scanId>')
@login_required
def project(id,scanId): 
    start = time.time()
    global projectJson
    project = list(filter(lambda x: x["properties"]['id']==id , projectsFile["features"]))[0]
    projectJson = json.load(open(project['properties']['folder_name']+'/file.json'))
    projectData = list(filter(lambda x: x['properties']['id']==scanId , projectJson["features"]))[0]
    imageName = projectData['properties']['name']
    imageUrl = project['properties']['folder_name']+projectData['properties']['url']
    imageColor = project['properties']['folder_name']+projectData['properties']['imgColor']
    imageCoord = projectData['geometry']['coordinates']
    imageRot = projectData['geometry']['rotation']
    global image
    global projectId
    projectId = id
    image = imagePano(imageName,projectJson)
    end = time.time()
    print(end - start)
    return render_template('User/project.html',folder_name = project['properties']['folder_name'],url = imageUrl, imgColor= imageColor, pos = imageCoord ,rot = imageRot, id = projectData['properties']['id'], name=current_user.username)

@app.route('/coordinates', methods=["POST", "GET"])
def coordinates():
    if request.method == 'POST':
        print('Successsssss')
        qtc_data = request.get_json()
        try:
            coordinates = image.getCoordinates(qtc_data)
        except:
            print('No Data Founded')
            return 'No Data Founded'
        distance = image.getDistance(qtc_data)
        if distance:
            results = {
                'coordinates': coordinates,
                'distance': distance
                }
            return jsonify(results)

@app.route('/distance', methods=["POST", "GET"])
def distance():
    if request.method == 'POST':
        print('Successsssss')
        uv_list = request.get_json()
        dist = image.getDistanceBetweenTwoPoints(uv_list)
        results = {
            'distance': dist
            }
    return jsonify(results)

@app.route('/infospots', methods=["POST", "GET"])
def infospots():
    if request.method == 'POST':
        infospots = image.getInfospots()
        infospotsCoord = []
        for i in infospots:
            scan = {}
            scan['id']=i
            scanData = list(filter(lambda x: x['properties']['id']==i , projectJson["features"]))[0]
            scan['coordinates']=scanData['geometry']['coordinates']
            infospotsCoord.append(scan)         
        results = {
            'id':projectId,
            'infospots': infospotsCoord
        }
        return results
    
@app.route('/objects', methods=["POST", "GET"])
def objects():
    if request.method == 'POST':
        objects = image.getObjects()
        results = {
            'id':projectId,
            'objects': objects
        }
        return results

@app.route('/allInfospots', methods=["POST", "GET"])
def allInfospots():
    if request.method == 'POST':
        expression = "features[*].[properties.id, properties.infospots]"
        prj = jmespath.search(expression,projectJson) 
        results = {
            'infospots': prj
        }
        return results
    

@app.route('/admin/saveInfospot', methods=["POST", "GET"])
def saveInfospot():
    if request.method == 'POST':
        project = list(filter(lambda x: x["properties"]['id']==projectId , projectsFile["features"]))[0]
        data = request.get_json()
        infospotForm = json.loads(data['infospotForm'])
        idinfospots = [int(infospotForm['firstScan']),int(infospotForm['secondScan'])]
        projectData = list(filter(lambda x: x['properties']['id']==idinfospots[0] , projectJson["features"]))[0]
        projectData['properties']['infospots'].append(idinfospots[1])
        projectData = list(filter(lambda x: x['properties']['id']==idinfospots[1] , projectJson["features"]))[0]
        projectData['properties']['infospots'].append(idinfospots[0])
        json.dump(projectJson,open(project['properties']['folder_name']+'/file.json','w'))
        return 'Success'
    
@app.route('/admin/deleteInfospot', methods=["POST", "GET"])
def deleteInfospot():
    if request.method == 'POST':
        project = list(filter(lambda x: x["properties"]['id']==projectId , projectsFile["features"]))[0]
        data = request.get_json()
        idOfdeletedInfospots = json.loads(data['deletedInfospots'])
        projectData = list(filter(lambda x: x['properties']['id']==idOfdeletedInfospots[0] , projectJson["features"]))[0]
        projectData['properties']['infospots'].remove(idOfdeletedInfospots[1])
        projectData = list(filter(lambda x: x['properties']['id']==idOfdeletedInfospots[1] , projectJson["features"]))[0]
        projectData['properties']['infospots'].remove(idOfdeletedInfospots[0])
        json.dump(projectJson,open(project['properties']['folder_name']+'/file.json','w'))
        return 'Success'
    
@app.route('/filter', methods=["POST", "GET"])
def filtering():
    if request.method == 'POST':
        data = request.get_json()
        projectText = data['project']
        addressText = data['location']
        datetext = data['date']
        expression = "features[?contains(properties.name,'"+projectText+"') && contains(properties.address,'"+addressText+"') && contains(properties.date,'"+datetext+"')]"
        prj = jmespath.search(expression,projectsFile)
        results = {
            'project': prj
        }
        return results
      
# @app.route('/ObjectFilter', methods=["POST", "GET"])
# def ObjectFilter():
#     if request.method == 'POST':
#         # data = request.get_json()
#         # projectText = data['project']
#         # print(projectJson)
#         expression = "features[?contains(properties.objects.name,Res)]."
#         print(expression)
#         prj = jmespath.search(expression,projectJson)
#         print(prj)
#         # results = {
#         #     'project': prj
#         # }
#         return 'results'  

@app.route('/admin')
@roles_required('Admin') 
def admin():
    return render_template('Admin/AdminHome.html', name=current_user.username)

@app.route('/loadProjects', methods=["POST", "GET"])
def loadProjects():
    if request.method == 'POST':
        projectsArray = {'project':projectsFile['features']}
        return projectsArray

@app.route('/admin/createProject')
@roles_required('Admin') 
def createProject():
    return render_template('Admin/createProject.html', name=current_user.username)

@app.route('/admin/new_Project',methods=["POST", "GET"])
def newProject():
    if request.method == 'POST':
        data = json.loads(request.get_json()['projectForm'])
        coordinates = data["coordinates"].split(',')
        project = newProjectObject(int(data["id"]),data["name"],data["description"],data["date"],data["address"],data["type"],data["folder"],[float(coordinates[0]),float(coordinates[1])])
        projectsFile["features"].append(project)
        json.dump(projectsFile,open('./static/projects/all.json','w'))
    return 'done'

@app.route('/admin/new_ProjectFile/<folderName>', methods=["POST", "GET"])  
def readFile(folderName):
    if request.method == 'POST':
        file = request.files['jsonFile']
        filename = secure_filename(file.filename)
        path = os.path.join("./static/projects/",folderName + '/' + filename)
        file.save(path)
        return 'success'

@app.route('/admin/modifyProject/<int:id>', methods=["POST", "GET"])
@roles_required('Admin') 
def modifyProject(id): 
    oldData = list(filter(lambda x: x['properties']['id']==id , projectsFile["features"]))[0]
    global index
    index = projectsFile['features'].index(oldData)
    if request.method == 'POST':
        return oldData
    return render_template('Admin/modifyProject.html',id = id, name=current_user.username)

@app.route('/admin/saveProject', methods=["POST", "GET"])
def saveProject():
    if request.method == 'POST':
        newData = json.loads(request.get_json()['projectForm'])
        project = newProjectObject(int(newData["id"]),newData["name"],newData["description"],newData["date"],newData["address"],newData["type"],newData["folder"],[float(coordinates[0]),float(coordinates[1])])
        projectsFile['features'][index] = project
        json.dump(projectsFile,open('./static/projects/all.json','w'))
        return render_template('Admin/AdminHome.html')

@app.route('/admin/delete_Project')
def deleteProject():
    element = list(filter(lambda x: x['properties']['id']==111 , projectsFile["features"]))[0]
    projectsFile['features'].remove(element)
    json.dump(projectsFile,open('./static/projects/all.json','w'))
    return render_template('Admin/AdminHome.html')
    
@app.route('/admin/<int:id>/<int:scanId>')
@roles_required('Admin') 
def adminProject(id,scanId):
    global projectJson
    project = list(filter(lambda x: x["properties"]['id']==id , projectsFile["features"]))[0]
    projectJson = json.load(open(project['properties']['folder_name']+'/file.json'))
    projectData = list(filter(lambda x: x['properties']['id']==scanId , projectJson["features"]))[0]
    imageName = projectData['properties']['name']
    imageUrl = project['properties']['folder_name']+projectData['properties']['url']
    imageColor = project['properties']['folder_name']+projectData['properties']['imgColor']
    imageCoord = projectData['geometry']['coordinates']
    imageRot = projectData['geometry']['rotation']
    global image
    global projectId,id_scan
    projectId = id
    id_scan = scanId
    image = imagePano(imageName,projectJson)
    return render_template('Admin/adminProject.html',folder_name = project['properties']['folder_name'],url = imageUrl, imgColor= imageColor, pos = imageCoord ,rot = imageRot, id = projectData['properties']['id'], name=current_user.username)

@app.route('/admin/saveObject', methods=["POST", "GET"])
def saveObject():
    if request.method == 'POST':
        projectsFile = json.load(open('./static/projects/all.json'))
        project = list(filter(lambda x: x["properties"]['id']==projectId , projectsFile["features"]))[0]
        data = request.get_json()
        objForm = json.loads(data['objForm'])
        points = json.loads(data['pointsPolygon'])        
        ptsPolygon = []
        for pt in points:
            ptsPolygon.append([float(pt['x']),float(pt['y']),float(pt['z'])])
        obj = {
            "id": int(objForm['id']),
            "name": objForm['name'],
            "description": objForm['description'],
            "imgName":objForm['image'],
            "points":ptsPolygon
        } 
        projectData = list(filter(lambda x: x['properties']['id']==id_scan , projectJson["features"]))[0]
        projectData['properties']['objects'].append(obj)
        json.dump(projectJson,open(project['properties']['folder_name']+'/file.json','w'))
        return 'Success'
    
@app.route('/admin/deleteObject', methods=["POST", "GET"])
def deleteObject():
    if request.method == 'POST':
        data = request.get_json()
        project = list(filter(lambda x: x["properties"]['id']==projectId , projectsFile["features"]))[0]
        projectData = list(filter(lambda x: x['properties']['id']==id_scan , projectJson["features"]))[0]
        obj = list(filter(lambda x:  x['id']==data['objId'] , projectData["properties"]["objects"]))[0]
        projectData["properties"]["objects"].remove(obj)
        json.dump(projectJson,open(project['properties']['folder_name']+'/file.json','w'))
        return 'Success'

if __name__ == "__main__":
    # app.run(debug=True, host= '192.168.220.246')
    app.run(debug=True, host="0.0.0.0")
    
