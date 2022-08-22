import { jsPDF} from 'jspdf';

async function addFonts()
{
    const arialTxt = await (await (await fetch("assets/fonts/arial/arial.txt")).text());
    const arialBoldTxt = await (await (await fetch("assets/fonts/arial/arial_bold.txt")).text());
    
    const callAddFont = function () {
      this.addFileToVFS('Arial.ttf', arialTxt);
      this.addFileToVFS('Arial-black.ttf', arialBoldTxt);
      this.addFont('Arial.ttf', 'Arial', 'normal');
      this.addFont('Arial-black.ttf', 'Arial-Black', 'normal');
    };
    
    jsPDF.API.events.push(['addFonts', callAddFont]);
}

addFonts();
