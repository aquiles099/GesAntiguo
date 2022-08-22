import { ToastrService } from 'ngx-toastr';
import { FormGroup } from '@angular/forms';
import { checkIfTheFileExtensionIsCorrect, toggleFullscreen } from '../shared/helpers';
import { getFileContent } from '../shared/helpers';

export class FormHelper
{
    public form:FormGroup;
    public selectedImageSrc:string = null;

    constructor(
    protected _toastrService:ToastrService
    )
    {
    }
        
    public async onSelectImage(event:any):Promise<void>
    {
        try {
            
            const file = event.target.files[0];
        
            if(file)
            {
                if( ! checkIfTheFileExtensionIsCorrect([file], ["jpg","jpeg","png"]) )
                    throw new Error("El archivo debe ser una imagen con extensión jpg, jpeg o png");

                this.selectedImageSrc = await getFileContent(file, "dataURL");
            }

        }
        catch (error)
        {
            this._toastrService.error(error.message, "Error");
            event.target.value = null;
        }
    }

    public toggleFullscreen(event:any):void
    {
        if( 
            this.selectedImageSrc !== "assets/images/profile-image.svg" &&
            this.selectedImageSrc !== "assets/images/logo-image.svg" 
        )
        toggleFullscreen(event);
    }

    public getFormValue(controlName:string):any
    {
      return this.form.get(controlName).value;
    }

    public controlIsInvalid(name:string):boolean
    {
        return this.form.get(name).invalid && (this.form.get(name).dirty || this.form.get(name).touched);
    }

    public togglePasswordVisibility(passwordField:HTMLInputElement):void
    {
        passwordField.type = passwordField.type === "password" ? "text" : "password";
    }
}