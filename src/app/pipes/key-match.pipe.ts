import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keyMatch'
})
export class KeyMatchPipe implements PipeTransform {

  transform(array: Array<any>, key:string): Array<any>
  {
    return ! key ? array : array.filter(item => {
      
      key = key.toString().trim().toLowerCase();

      if(typeof item === "object" && item !== null)
      {
        switch(true)
        {
          case "nombre" in item:
            return item.nombre.toLowerCase().includes(key);
        
          case "name" in item:
            return item.name.toLowerCase().includes(key);

          case "key" in item:
            return item.key.toLowerCase().includes(key);

          default:
            return true;
        }
      }
      else
      {
        return item.toString().toLowerCase().includes(key);
      }
    
    });
  }

}
