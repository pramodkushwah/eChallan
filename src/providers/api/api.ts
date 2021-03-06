import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events, AlertController } from 'ionic-angular';

import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/interval';



import { StorageService } from '../localstorage/storage';
import { Uid } from '../../../node_modules/@ionic-native/uid';
import { AndroidPermissions } from '../../../node_modules/@ionic-native/android-permissions';

/**
 * Api is a generic REST Api handler. Set your API url first.
 */
@Injectable()
export class Api {
  url: string = 'http://182.75.23.84:8002';
  sub: any;

  constructor(public http: HttpClient, 
    public localStorage:StorageService, 
    public events:Events, 
    public alertCtrl: AlertController,
    private uid: Uid, 
    private androidPermissions: AndroidPermissions){
    
      // this.sub = Observable.interval(10*60*1000).subscribe((val) => {
      //   if(this.localStorage.getData('ngStorage-token')) {
      //     this.showError('Session Expired');
      //     this.localStorage.clearData();
      //   }
      // });
    this.getImei();
  }

  async getImei() {
    const { hasPermission } = await this.androidPermissions.checkPermission(
      this.androidPermissions.PERMISSION.READ_PHONE_STATE
    );
   
    if (!hasPermission) {
      const result = await this.androidPermissions.requestPermission(
        this.androidPermissions.PERMISSION.READ_PHONE_STATE
      );
   
      if (!result.hasPermission) {
        throw new Error('Permissions required');
      }
   
      // ok, a user gave us permission, we can get him identifiers after restart app
      return;
    }
    this.localStorage.storeData('IMEI',this.uid.IMEI);
    return this.uid.IMEI
   }

  getHeaders(optHeaders?: HttpHeaders) {
    let headers = new HttpHeaders();
    if (this.localStorage.getData('ngStorage-token')) {
      headers = headers.set('Authorization', 'Bearer ' + this.localStorage.getData('ngStorage-token'));  
    }
    if(this.localStorage.getData('IMEI')){
      headers = headers.set('imei', this.localStorage.getData('IMEI'));
    }
    if (optHeaders) {
      for (const optHeader of optHeaders.keys()) {
        headers = headers.append(optHeader, optHeaders.get(optHeader));
      }
    }
    return headers;
  }

  get(endpoint: string, optHeaders?: HttpHeaders) {
    const headers = this.getHeaders(optHeaders);
    return this.http
      .get(this.url + '/' + endpoint, { headers: headers, observe: 'response' })
      .map(this.extractData)
      .catch(this.handleError);
  }

  post(endpoint: string, body: any, optHeaders?: HttpHeaders) {
    const headers = this.getHeaders(optHeaders);
    return this.http
      .post(this.url + '/' + endpoint, body, {
        headers: headers,
        observe: 'response'
      })
      .map(this.extractData)
      .catch(this.handleError);
  }

  put(endpoint: string, body: any, optHeaders?: HttpHeaders) {
    const headers = this.getHeaders(optHeaders);
    return this.http
      .put(this.url + '/' + endpoint, body, {
        headers: headers,
        observe: 'response'
      })
      .map(this.extractData)
      .catch(this.handleError);
  }

  delete(endpoint: string, optHeaders?: HttpHeaders) {
    const headers = this.getHeaders(optHeaders);
    return this.http
      .delete(this.url + '/' + endpoint, {
        headers: headers,
        observe: 'response'
      })
      .map(this.extractData)
      .catch(this.handleError);
  }

  patch(endpoint: string, body: any, optHeaders?: HttpHeaders) {
    const headers = this.getHeaders(optHeaders);
    return this.http
      .put(this.url + '/' + endpoint, body, {
        headers: headers,
        observe: 'response'
      })
      .map(this.extractData)
      .catch(this.handleError);
  }

  extractData(response: HttpResponse<any>) {
    return response.body || response.status;
  }

  handleError = (errorResponse: HttpErrorResponse) => {
    switch (errorResponse.status) {
      case 400:
        if(errorResponse.url === this.url + '/Token')
          this.showError('Access Denied');
        break;
      case 401:
        if(errorResponse.url != this.url + '/Image'){
          this.showError('Session Expired');
          this.localStorage.clearData();
        }
        break;      
      case 0:
        this.showError('You don\'t seem to have an active internet connection. Please connect and try again.' )
        break;
    
      default:
        this.showError(errorResponse.error.message || 'Somthing went wrong');
        break;
    }
    return Observable.throw(errorResponse);
  }

  showError(message){
    const alert = this.alertCtrl.create({
      title: 'Error',
      subTitle: message,
      buttons: ['OK']
    })
    alert.present();
  }
}
