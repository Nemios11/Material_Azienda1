import { Component, OnInit } from '@angular/core';
import { Observable, timer } from 'rxjs';

@Component({
  selector: 'app-rolling',
  templateUrl: './rolling.component.html',
  styleUrls: ['./rolling.component.css']
})
export class RollingComponent implements OnInit {

  selfWidth: number = 60;
  selfHeight: number = 60;

  selfPos_Prev: number[] = [0, 0]; //Left, top
  selfPos_Curr: number[] = [0, 0]; //Left, top
  selfPos_CurrEdge: number = 0;

  selfBackColor: number[] = [0, 0, 255];
  selfOrderColor: number[] = [];

  selfTransition_Top_Ended: boolean = true;
  selfTransition_Left_Ended: boolean = true;
  selfCountFails: number = 0;

  selfTransition_Color: number = 2.0;
  selfTransition_Position: number = 2.0;
  selfTransitionString: string = 'all 2.0s linear 0s';

  constructor() { }

  ngOnInit() {
    var 
      everySecond: Observable<number> = timer(0, 2200),
      everySecondSub: any;

    everySecondSub = everySecond.subscribe((procs) => {
      this.setNewColor();

      this.setRandomPosition();

      //Unset this, as it won't be needed anymore
      everySecondSub.unsubscribe();
    });
  }

  getColor(): string
  {
    return ('rgba('+this.selfBackColor[0]+', '+this.selfBackColor[1]+', '+this.selfBackColor[2]+', 1)');
  }
  getPos(value: number): string
  {
    return (value+'px');
  }

  onTransitionEnd(eEvent: TransitionEvent)
  {
    //Only 1 proc per transition end!
    if (eEvent.propertyName == 'background-color')
    {
      this.setNewColor();

    } else if (eEvent.propertyName == 'top')
    {
      this.selfTransition_Top_Ended = true;

    } else if (eEvent.propertyName == 'left')
    {
      this.selfTransition_Left_Ended = true;

    }

    if (this.selfTransition_Top_Ended && this.selfTransition_Left_Ended)
    {
      this.setNewPosition();
    }
  }

  randomQty(iMax: number): number
  {
    var
      iResult: any = Math.floor(Math.random()*iMax);

    return iResult;
  }

  getMaxPosX(): any
  {
    return window.innerWidth-this.selfWidth;
  }

  getMaxPosY(): any
  {
    return window.innerHeight-this.selfHeight;
  }

  setTransition()
  {
    this.selfTransitionString = 'all '+this.selfTransition_Color+'s linear 0s, top '+this.selfTransition_Position+'s linear 0s, left '+this.selfTransition_Position+'s linear 0s';
  }

  /*
    Let's do some math...
    How do we find the correct destination when we can't simply mirror the previous starting point?
    Well, we take the formula for the line between the current point and the wrong destination, and then we use the coordinate we do know
    to find the one we don't have yet.
    (x2 != x1 and y2 != y1)
    (x-x1)/(x2-x1) = (y-y1)/(y2-y1)
    (x-x1)*(y2-y1) = (y-y1)*(x2-x1)
    x*(y2-y1) -x1*y2 +x1*y1 = y*(x2-x1) -x2*y1 +x1*y1
    x*(y2-y1) -x1*y2 = y*(x2-x1) -x2*y1
    x = (y*(x2-x1) -x2*y1 +x1*y2)/(y2-y1)
    y = (x*(y2-y1) -x1*y2 +x2*y1)/(x2-x1)
  */
 getCoordX(aP1: number[], aP2: number[], iY: number): number
 {
   if ((aP1[0] == aP2[0]) || (aP1[1] == aP2[1])) //Just in case; not actually needed, since in this case it shouldn't be asking for the correct coordinate here
   {
     return aP2[0];
   }else
   {
     return Math.round((iY*(aP2[0]-aP1[0]) -aP2[0]*aP1[1] +aP1[0]*aP2[1])/(aP2[1]-aP1[1]));
   }
 }
 getCoordY(aP1: number[], aP2: number[], iX: number): number
 {
   if ((aP1[0] == aP2[0]) || (aP1[1] == aP2[1])) //Just in case; not actually needed, since in this case it shouldn't be asking for the correct coordinate here
   {
     return aP2[1];
   }else
   {
     return Math.round((iX*(aP2[1]-aP1[1]) -aP1[0]*aP2[1] +aP2[0]*aP1[1])/(aP2[0]-aP1[0]));
   }
 }
 setNewPosition()
 {
   var
     iX2: number, iY2: number, iEdge2: number, iDistance: number,
     aMirror: number[], aNewPos: number[];

   //Find the position simmetrical to selfPos_Prev in respect to selfPos_Curr
   switch(this.selfPos_CurrEdge)
   {
     case 0: //top
       aMirror = [
         Math.round(this.selfPos_Prev[0]-2*(this.selfPos_Prev[0]-this.selfPos_Curr[0])),
         this.selfPos_Prev[1]
       ];
       iX2 = this.getCoordX(aMirror, this.selfPos_Curr, this.getMaxPosY());
       iY2 = this.getMaxPosY();

       iEdge2 = 2;
       aNewPos = [iX2, iY2];

       //Check if it's actually inside the window and, if not, get the correct destination
       if (iX2 <= 0)
       {
         aNewPos = [
           0,
           this.getCoordY([iX2, iY2], this.selfPos_Curr, 0)
         ];

         iEdge2 = 3;

       } else if (iX2 >= this.getMaxPosX())
       {
         aNewPos = [
           this.getMaxPosX(),
           this.getCoordY([iX2, iY2], this.selfPos_Curr, this.getMaxPosX())
         ];

         iEdge2 = 1;

       }
       break;

     case 1: //right
       aMirror = [
         this.selfPos_Prev[0],
         Math.round(this.selfPos_Prev[1]-2*(this.selfPos_Prev[1]-this.selfPos_Curr[1]))
       ];
       iX2 = 0;
       iY2 = this.getCoordY(aMirror, this.selfPos_Curr, 0);

       iEdge2 = 3;
       aNewPos = [iX2, iY2];

       //Check if it's actually inside the window and, if not, get the correct destination
       if (iY2 <= 0)
       {
         aNewPos = [
           this.getCoordX([iX2, iY2], this.selfPos_Curr, 0),
           0
         ];

         iEdge2 = 0;

       } else if (iY2 >= this.getMaxPosY())
       {
         aNewPos = [
           this.getCoordX([iX2, iY2], this.selfPos_Curr, this.getMaxPosY()),
           this.getMaxPosY()
         ];

         iEdge2 = 2;

       }
       break;

     case 2: //bottom
       aMirror = [
         Math.round(this.selfPos_Prev[0]-2*(this.selfPos_Prev[0]-this.selfPos_Curr[0])),
         this.selfPos_Prev[1]
       ];
       iX2 = this.getCoordX(aMirror, this.selfPos_Curr, 0);
       iY2 = 0;

       iEdge2 = 0;
       aNewPos = [iX2, iY2];

       //Check if it's actually inside the window and, if not, get the correct destination
       if (iX2 <= 0)
       {
         aNewPos = [
           0,
           this.getCoordY([iX2, iY2], this.selfPos_Curr, 0)
         ];

         iEdge2 = 3;

       } else if (iX2 >= this.getMaxPosX())
       {
         aNewPos = [
           this.getMaxPosX(),
           this.getCoordY([iX2, iY2], this.selfPos_Curr, this.getMaxPosX())
         ];

         iEdge2 = 1;

       }
       break;

     default: //left
       aMirror = [
         this.selfPos_Prev[0],
         Math.round(this.selfPos_Prev[1]-2*(this.selfPos_Prev[1]-this.selfPos_Curr[1]))
       ];
       iX2 = this.getMaxPosX();
       iY2 = this.getCoordY(aMirror, this.selfPos_Curr, this.getMaxPosX());

       iEdge2 = 1;
       aNewPos = [iX2, iY2];

       //Check if it's actually inside the window and, if not, get the correct destination
       if (iY2 <= 0)
       {
         aNewPos = [
           this.getCoordX([iX2, iY2], this.selfPos_Curr, 0),
           0
         ];

         iEdge2 = 0;

       } else if (iY2 >= this.getMaxPosY())
       {
         aNewPos = [
           this.getCoordX([iX2, iY2], this.selfPos_Curr, this.getMaxPosY()),
           this.getMaxPosY()
         ];

         iEdge2 = 2;

       }
       break;
   }

   //Save the old current position
   this.selfPos_Prev = [this.selfPos_Curr[0], this.selfPos_Curr[1]];

   //Save the destination as the future "current" position
   this.selfPos_Curr = [aNewPos[0], aNewPos[1]];
   this.selfPos_CurrEdge = iEdge2;

   //And set the speed
   iDistance = (((this.selfPos_Prev[0]-this.selfPos_Curr[0])**2)+((this.selfPos_Prev[1]-this.selfPos_Curr[1])**2))**(1/2);

   if (iDistance > 10)
   {
     this.selfTransition_Position = Math.round(10*iDistance/150)/10;
     this.setTransition();

     //Also, set the bools and counts
     this.selfTransition_Top_Ended = false;
     this.selfTransition_Left_Ended = false;
     this.selfCountFails = 0;

   }else
   {
     //Destination too close to be worth playing the animation; skip it
     if (this.selfCountFails < 10)
     {
      this.selfCountFails += 1;
      this.setNewPosition();
     }else
     {
      this.selfCountFails = 0;
      this.setRandomPosition();
     }
   }
 }

 setNewColor()
 {
   var
     aTemp: number[],
     i: number, i2: number, iID: number, iNewVal: number;

   //Make sure there's an iID to get: shuffle the possibilities
   if (this.selfOrderColor.length <= 0)
   {
     aTemp = [0, 1, 2];
     for (i = aTemp.length-1; i >= 0; i--)
     {
       iID = this.randomQty(i+1);
       this.selfOrderColor.push(aTemp[iID]);
       aTemp[iID] = aTemp[i];
     }
   }

   //Get iID
   iID = this.selfOrderColor[this.selfOrderColor.length-1];
   this.selfOrderColor.pop();

   //Get the new color
   iNewVal = this.selfBackColor[iID]+50+this.randomQty(157); //Min +50, max +206
   if (iNewVal > 255)
   {
     iNewVal -= 256;
   }

   this.selfTransition_Color = Math.round(10*Math.abs(iNewVal-this.selfBackColor[iID])/75)/10;
   this.selfBackColor[iID] = iNewVal;

   this.setTransition();
  }

  setRandomPosition()
  {
    this.selfPos_CurrEdge = 1+this.randomQty(2);

    switch(this.selfPos_CurrEdge)
    {
      case 0: //top; never happens, but still... it may be useful to have the complete roster around
        this.selfPos_Curr = [
          20+this.randomQty(this.getMaxPosX()-40),
          0
        ];
        break;

      case 1: //right
        this.selfPos_Curr = [
          this.getMaxPosX(),
          20+this.randomQty(this.getMaxPosY()-40)
        ];
        break;

      case 2: //bottom
        this.selfPos_Curr = [
          20+this.randomQty(this.getMaxPosX()-40),
          this.getMaxPosY()
        ];
        break;

      default: //left; never happens, but still... it may be useful to have the complete roster around
        this.selfPos_Curr = [
          0,
          20+this.randomQty(this.getMaxPosY()-40)
        ];
        break;
    }

    //We haven't failed yet
    this.selfCountFails = 0;

    //And set the speed
    var iDistance = (((this.selfPos_Prev[0]-this.selfPos_Curr[0])**2)+((this.selfPos_Prev[1]-this.selfPos_Curr[1])**2))**(1/2);

    if (iDistance > 10)
    {
      this.selfTransition_Position = Math.round(10*iDistance/150)/10;
      this.setTransition();

      //Also, set the bools
      this.selfTransition_Top_Ended = false;
      this.selfTransition_Left_Ended = false;
    }else
    {
      //Destination too close to be worth playing the animation; skip it
      this.setNewPosition();
    }
  }

}
