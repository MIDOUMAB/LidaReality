import cv2
import math
import json
import numpy as np
import pandas as pd
import os
import glob

def rotateVectorX(vector, theta) :
    y = vector[1]
    z = vector[2]
    vector[1] = y * math.cos(theta) - z * math.sin(theta)
    vector[2] = y * math.sin(theta) + z * math.cos(theta)
    return vector

def rotateVectorY(vector, theta):
    x = vector[0]
    z = vector[2]
    vector[0] = x * math.cos(theta) + z * math.sin(theta)
    vector[2] = -x * math.sin(theta) + z * math.cos(theta)
    return vector

def rotateVectorZ(vector, theta) :
    x = vector[0]
    y = vector[1]
    vector[0] = x * math.cos(theta) - y * math.sin(theta)
    vector[1] = x * math.sin(theta) + y * math.cos(theta)
    return vector

def transformCoordinates(x, y, z, thetaX, thetaY, thetaZ):
    vector = [x,y,z]
    vector=rotateVectorX(vector, thetaX)
    vector=rotateVectorY(vector, thetaY)
    vector=rotateVectorZ(vector, thetaZ)
    return vector


class imagePano:
    def __init__(self, name,project):
        self.name = name
        self.projectFile = project
        self.depth = cv2.imread('./static/'+self.projectFile['url']+'/depth/depth_'+self.name+'.tiff',-1)
        self.data = list(filter(lambda x: x['properties']['name']==self.name,self.projectFile["features"]))[0]
        self.imageShape = self.data['properties']['shape']
        self.coordinates = self.data['geometry']['coordinates']
        self.infospots = self.data['properties']['infospots']
        self.objects = self.data['properties']['objects']
        print('./static/projects/'+self.projectFile['name']+'/depth/depth_'+self.name+'.tiff')
        
    def getCoordinates(self,uv):
        
        i = int(uv['x'] * self.depth.shape[1])
        j = int(self.depth.shape[0] - uv['y'] * self.depth.shape[0])
        print(i,j)
        print(self.depth[j, i])
        if self.depth[j, i] == 0:
            raise Exception('sorry')
        else:
            alpha = i * 360 / self.imageShape[1] 
            p90 = 90 * self.imageShape[0] /150 
            beta = (int(p90) - j - 1) * 150 / self.imageShape[0]
            beta = beta * math.pi / 180
            dz = self.depth[j, i] * math.sin(beta)
            dh = self.depth[j, i] * math.cos(beta)
            alpha =  alpha  * math.pi / 180
            dx = dh * math.sin(alpha)
            dy = dh * math.cos(alpha)
            return [round(dx+self.coordinates[0],3),round(dy+self.coordinates[1],3),round(dz+self.coordinates[2],3)]
    
    def getDistance(self,uv):
        i = int(uv['x'] * self.depth.shape[1])
        j = int(self.depth.shape[0] - uv['y'] * self.depth.shape[0])
        return round(float(self.depth[j,i]),3)
    
    def getDistanceBetweenTwoPoints(self,uvList):
        point1 = self.getCoordinates(uvList[0])
        point2 = self.getCoordinates(uvList[1])
        dh = math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2 )
        di = math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2 + (point1[2] - point2[2]) ** 2)        
        dz = point2[2] - point1[2]
        return {'DH':round(dh,3),'DI':round(di,3),'DZ':round(dz,3)}
    
    def getInfospots(self):
        return self.infospots
    
    def getObjects(self):
        return self.objects
        

def newProjectObject(id, name, description, date, address, type, folderName,coordinates):
    # img = glob.glob("./static/projects/"+folderName+'/image pano/*.jpg')[0]
    img = os.listdir("./static/projects/"+folderName+'/image pano')[0]
    project = {
        "type": "Feature",
        "properties":{
            "id" : id,
            "name" : name,
            "description" : description,
            "address" : address,
            "date" : date,
            "type" : type,
            "folder_name":"./static/projects/"+folderName,
            "img":"./static/projects/"+folderName+"/image pano/"+img,
        },
        "geometry": {
          "coordinates": coordinates,
          "type": "Point"
        }
    }
    print("Project created")
    return project
   

def toDepth(file, filename,xs,ys,zs):
        df = pd.read_csv(file,sep=" ",header=None)
        data = df.values
        
        imax = data[:, 0].max()
        jmax = data[:, 1].max()
        
        depth = np.zeros((int(imax) + 1,int(jmax) + 1),dtype=np.float32)
        
        for pt in data:
                r = np.sqrt((pt[2] - xs)**2 + (pt[3] - ys)**2 + (pt[4] - zs)**2)
                depth[int(pt[0]),int(pt[1])] = r
        
        image = cv2.imread(filename.split('.')[0] + '.jpg')
        diff = depth.shape[1] - image.shape[1]
        left_depth = depth[:,0:int(depth.shape[1]/2 - diff/2)]
        right_depth = depth[:,int(depth.shape[1]/2 + diff/2):depth.shape[1]]
        result = np.zeros((depth.shape[0],image.shape[1]),dtype=np.float32)
        result[:,0:left_depth.shape[1]] = left_depth
        result[:,left_depth.shape[1]:image.shape[1]] = right_depth
        
        deference = int((result.shape[1] - result.shape[0] * 2)/2)
        bottom = np.full((deference,result.shape[1]), 255, dtype=np.float32)
        final_depth = np.vstack((result,bottom))
        
        cv2.imwrite(filename.split('.')[0] + '.tiff', final_depth)
  