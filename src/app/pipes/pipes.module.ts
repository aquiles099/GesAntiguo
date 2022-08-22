import { NgModule } from '@angular/core';
import { KeyMatchPipe } from './key-match.pipe';
import { SafeHtmlPipe } from './safe-html.pipe';
import { ValueKeyPipe } from './value-key.pipe';

@NgModule({
  declarations: [
    KeyMatchPipe,
    SafeHtmlPipe,
    ValueKeyPipe,
  ],
  exports: [
    KeyMatchPipe,
    SafeHtmlPipe,
    ValueKeyPipe
  ]
})
export class PipesModule { }
