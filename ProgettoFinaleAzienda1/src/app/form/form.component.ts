import { Component, OnInit } from '@angular/core';  
import { DatiIntervento } from '../dati-intervento';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  MAT_MOMENT_DATE_FORMATS,
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import { WorkerService } from "../http.service";


@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'it'},
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS}
  ]
})
export class FormComponent implements OnInit {

  //Form data
  MyForm: FormGroup;
  DatiForm: DatiIntervento = new DatiIntervento();

  //Constants
  constants = {
    maxDescription: 25,
    maxDetail: 100,
    numStones: 5
  }

  //Rolling balls!
  aArrayStones: number[] = [];
  
  //Required for the price field
  bPrice_WasThousChar_LeftCaretSide: boolean;
  bPrice_WasDecChar_LeftCaretSide: boolean;
  bPrice_WasThousChar_RightCaretSide: boolean;
  bPrice_WasDecChar_RightCaretSide: boolean;
  iPrice_LastCaretPos: number;

  constructor(private builder: FormBuilder, private _adapter: DateAdapter<any>, private workerService: WorkerService) { }

  ngOnInit() {
    this.MyForm = this.builder.group({
      description: ['', (val: any) => { return (((val.value || '').length > 0)? null : {'error': 'La descrizione è necessaria.'}) }],
      detail: [''],
      date: ['', (val: any) => {return this.validateDatelocal()}],
      time: ['', (val: any) => {return this.validateDatelocal()}],
      price: ['', (val: any) => {return ((((val.value || '').length > 0) && (val.value != '-'))? null : {'error': 'Il prezzo è necessario.'})}],
      worker:["", [(val:any) => {return this.validateWorker(val.value)}]]
    });

    //Trigger the resize event, so that it will auto-center on init
    window.dispatchEvent(new Event('resize'));

    //Create bubbles
    var
      i: number;
    for (i = 0; i < this.constants.numStones; i++)
    {
      this.aArrayStones.push(0);
    }
  }

  onResize(divRef: any)
  {
    var
      iHeight: number = (window.innerHeight-divRef.getBoundingClientRect().height)/2;

    if (iHeight < 0)
    {
      divRef.style.marginTop = '0px';
    }else
    {
      divRef.style.marginTop = iHeight+'px';
    }
  }

  onSubmit()
  {
    this.workerService.postData(this.DatiForm);
  }

  resetFormData()
  {
    this.DatiForm.dettaglio = '';
  }

  price_KeyUpPrice(val :any)
  {
    //Record some data: we're going to need it to handle chars being deleted
    var
      sDecimalChar = (1.1).toLocaleString(),
      sThousandChar = (1000).toLocaleString();

    sDecimalChar = sDecimalChar.substring(1, sDecimalChar.length-1);
    sThousandChar = sThousandChar.substring(1, sThousandChar.length-3);

    this.bPrice_WasThousChar_LeftCaretSide = (val.value[val.selectionStart-1] && (val.value[val.selectionStart-1] == sThousandChar));
    this.bPrice_WasDecChar_LeftCaretSide = (val.value[val.selectionStart-1] && (val.value[val.selectionStart-1] == sDecimalChar));
    this.bPrice_WasThousChar_RightCaretSide = (val.value[val.selectionStart] && (val.value[val.selectionStart] == sThousandChar));
    this.bPrice_WasDecChar_RightCaretSide = (val.value[val.selectionStart] && (val.value[val.selectionStart] == sDecimalChar));

    //Ignore the negative sign
    if ((val.value.length > 0) && (val.value[0] == '-'))
    {
      this.iPrice_LastCaretPos = val.selectionStart-1;
    }else
    {
      this.iPrice_LastCaretPos = val.selectionStart;
    }
  }

  price_ValidatePrice(val: any) //Doesn't actually validate anything; it is instead passed onInput, so that we can use the element ref to fix its value on the fly
  {
    var
      i: number, iTemp: number, iCaret: number,
      sTemp: string, sResult: string,
      sTxt: any = val.value,
      aArr: string[] = [''],
      sDecimalChar = (1.1).toLocaleString(),
      sThousandChar = (1000).toLocaleString();

    if ((sTxt.length > 0) && (sTxt != '-'))
    {
      sDecimalChar = sDecimalChar.substring(1, sDecimalChar.length-1);
      sThousandChar = sThousandChar.substring(1, sThousandChar.length-3);

      sResult = '';

      //New caret pos - will refine it along the way
      iCaret = val.selectionStart;

      //Parse the input's value
      for (i = 0; i < sTxt.length; i++)
      {
        if (isNaN(sTxt[i]))
        {
          if (sTxt[i] == sDecimalChar)
          {
            //Was a decimal char
            if (aArr.length < 2)
            {
              aArr.push('');
            }else
            {
              //Wasn't the first one; ignore it and adjust the caret
              if (i < val.selectionStart)
              {
                iCaret -= 1;
              }
            }
          }else if ((i == 0) && (sTxt[i] == '-'))
          {
            //Was the sign
            sResult = '-';
          }else
          {
            //Was something else; ignore it and adjust the caret
            if (i < val.selectionStart)
            {
              iCaret -= 1;
            }
          }
        }else
        {
          aArr[aArr.length-1] += sTxt[i];
        }
      }

      //Something was deleted: determine what it was and act accordingly
      if (this.DatiForm.price && (this.DatiForm.price.length == (sTxt.length+1)))
      {
        //sDecimalChar was deleted on the left
        if (this.bPrice_WasDecChar_LeftCaretSide && (val.value[val.selectionStart-1] != sDecimalChar))
        {
          //Remove the last 2 digits from aArr[0] and add them as aArr[1]
          aArr.push(aArr[0][aArr[0].length-2]+''+aArr[0][aArr[0].length-1]);
          aArr[0] = aArr[0].substring(0, aArr[0].length-2);
        }

        //sThousandChar was deleted on the left
        if (this.bPrice_WasThousChar_LeftCaretSide && (val.value[val.selectionStart-1] != sThousandChar))
        {
          //Adjust the caret
          if (iTemp)
          {
            iTemp -= 1;
          }else
          {
            iTemp = -1;
          }
        }

        //sDecimalChar was deleted on the right
        if (this.bPrice_WasDecChar_RightCaretSide && (val.value[val.selectionStart] != sDecimalChar))
        {
          //Remove the last 2 digits from aArr[0] and add them as aArr[1]
          aArr.push(aArr[0][aArr[0].length-2]+''+aArr[0][aArr[0].length-1]);
          aArr[0] = aArr[0].substring(0, aArr[0].length-2);

          //Adjust the caret
          iCaret +=1;
        }

        //Something was deleted on the left, while on the right there is and was an sThousandChar
        if (this.bPrice_WasThousChar_RightCaretSide && (val.value[val.selectionStart] == sThousandChar))
        {
          //Adjust the caret
          if (iTemp)
          {
            iTemp -= 1;
          }else
          {
            iTemp = -1;
          }
        }

        //Something was deleted on the left, while on the right there is and was an sDecimalChar and there were no integers
        if ((aArr[0].length <= 0) && this.bPrice_WasDecChar_RightCaretSide && (val.value[val.selectionStart] == sDecimalChar))
        {
          //Adjust the caret
          if (iTemp)
          {
            iTemp -= 1;
          }else
          {
            iTemp = -1;
          }
        }
      }

      //Concatenate the integers (if they exist)
      sTemp = '';
      if (!iTemp) //iTemp might have been assigned when detecting that sThousandChar (or something else) was deleted on the left
      {
        iTemp = 0; //Counts the sThousandChars added to the left of the current iCaret
      }
      if (aArr[0].length > 0)
      {
        //They exist: add them, and also inject sThousandChar
        for (i = aArr[0].length-1; i >= 0; i--)
        {
          if ((i < (aArr[0].length-1)) && (((aArr[0].length-i-1)%3) == 0))
          {
            sTemp = sThousandChar+sTemp;

            //Adjust the caret if needed
            if (iCaret > (sResult.length+i))
            {
              iTemp += sThousandChar.length;
            }
          }
          sTemp = aArr[0][i]+sTemp;
        }
      }else
      {
        sTemp += '0';
        
        if (aArr.length < 2)
        {
          iTemp +=2; //The user just wrote something different from the sDecChar
        }else
        {
          iTemp +=1; //The user just wrote the sDecChar
        }
      }
      sResult += sTemp;
      iCaret += iTemp;

      //Concatenate the decimals (+ make sure that they exist)
      if (aArr.length < 2)
      {
        aArr.push('00');
      }
      while (aArr[1].length < 2)
      {
        aArr[1] += '0';
      }
      sResult += sDecimalChar+aArr[1][0]+aArr[1][1]; //Max 2 decimal positions

      //Save the parsed price and restore the caret
      val.value = sResult;

      val.selectionStart = iCaret;
      val.selectionEnd = iCaret;

      //Also save the value
      this.DatiForm.price = sResult;

      /*
      //This would save it as a number instead of as a string
      this.DatiForm.price = Number(aArr[0])+(Number(aArr[1][0])/10)+(Number(aArr[1][1])/100);
      if (sResult[0] == '-')
      {
        this.DatiForm.price *= -1;
      }
      */
    }
  }

  getFilteredList()
  {
    var 
      aOption: any[],
      aResult: any[] = [],
      aList: any[] = this.workerService.getList(),
      sTxt: string = (this.MyForm.get('worker').value || '').toLowerCase(); 

    for (aOption of aList)
    {
      if ((aOption[0].toLowerCase()).includes(sTxt))
      {
        aResult.push(aOption);
      }
    }

    return aResult;
  }

  validateWorker(sTxt: string){
    var
      aItem: any [];
     
    for(aItem of this.workerService.getList())
    {
      if(sTxt == aItem[0]){
        this.DatiForm.worker_id = aItem[1];
        return null;
      }
    }    
    return {'error': 'Manutentore non trovato'}
  }

  validateDatelocal(){
    if (this.MyForm)
    {
      var
        dateWTF: any = new Date(this.MyForm.get('date').value),
        valueDatalocal: string = dateWTF.getFullYear()+'-'+(dateWTF.getMonth()+1)+'-'+dateWTF.getDate()+'T'+this.MyForm.get('time').value,
        datetoday: any = new Date(),
        dateinput: any = new Date(valueDatalocal);

      if (dateinput >= datetoday){
        this.DatiForm.date = valueDatalocal+':00';

        //We need to set both forms as valid! Also, no need to check for PW1_form: it wouldn't be valid otherwise
        this.MyForm.get('date').setErrors(null);
        this.MyForm.get('time').setErrors(null);

        return null;

      } else { 

        this.MyForm.get('date').setErrors({'error': "Assegna una data valida!"});
        this.MyForm.get('time').setErrors({'error': "Assegna una data valida!"});

        return {'error': "Assegna una data valida!"};    
      }   
    }else
    {
      return {
        'error': "Form non pronto"
      } 
    }
  }
}
