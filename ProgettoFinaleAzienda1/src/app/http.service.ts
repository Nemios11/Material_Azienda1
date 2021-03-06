import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatiIntervento } from './dati-intervento';


@Injectable({
  providedIn: 'root'
})
export class WorkerService {

  results: any[];
  private apiUrlget = 'https://reqres.in/api/users?per_page=100';
  private apiUrlpost = 'https://reqres.in/api/users';

  iLastPostResponse: number = -1; //-1: not sent, 0: sending, 1: success, 2: failure

  constructor(private AppService: HttpClient ) { }

  getHeader()
  {
    return {
      headers: new HttpHeaders({
        'Content-type': 'application/json',
        'Authorization' : 'my-auth-token'
      })
    };
  }

  getList()
  {
    if ((this.results == null) || (this.results == undefined)) {
      this.results = [];
      this.AppService.get<string[]>(
        this.apiUrlget,
        this.getHeader()            
      ).subscribe(
        (res: any) => {
          console.log('Dati lavoratori:');
          console.log(res);
          for (var i = 0; i < res.data.length; i++)
          {
            this.results.push([res.data[i].last_name + ', ' + res.data[i].first_name, res.data[i].id, res.data[i].avatar]);
          }
        }, 
        err => {
          console.log(err);
        }
      )
    }
    return this.results;
  }

  postData(data: DatiIntervento)
  {
    console.log('Dati da inviare:');
    console.log(data);

    this.iLastPostResponse = 0; //Sending
    
    this.AppService.post(this.apiUrlpost, data).subscribe(
      (res: any)=>{
        console.log('Dati inviati correttamente:');
        console.log(res);

        this.iLastPostResponse = 1; //Success
      },
      (res: any)=>{
        console.log('Errore:');
        console.log(res);

        this.iLastPostResponse = 2; //Failure
      }
    )
  }
}
