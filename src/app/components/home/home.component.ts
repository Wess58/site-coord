import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  data: any[] = [] ;
  loading = false;

  constructor(private http: HttpClient) { }

  onFileChange(evt: any): void {
    const target: DataTransfer = <DataTransfer>(evt.target);
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });


      this.data = jsonData.slice(1).map((row: any) => ({
        latitude: row[0],
        longitude: row[1],
        county: 'Loading...'
      }));

      this.resolveCounties();
    };

    reader.readAsBinaryString(target.files[0]);
  }



  resolveCounties() {
    this.loading = true;
    this.data.forEach((coord, index) => {

      setTimeout(() => {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${coord.latitude}&lon=${coord.longitude}&format=json&zoom=10`;

        this.http.get(url).subscribe({
          next: (res: any) => {
            this.data[index].county = res?.address?.county || res?.address?.state || 'Unknown';
          },
          error: () => {
            this.data[index].county = 'Error';
          },
          complete: () => {
            if (index === this.data.length - 1) this.loading = false;
          }
        });
      }, 1100 * (index + 1));

    });
  }


  generateExcel(): void {

    const filename = 'site-coordinates-processed.xlsx'
    const workSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.data);
    const workBook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, 'Data');

    XLSX.writeFile(workBook, filename);

    setTimeout(() => {
      location.reload();
    }, 7000);
  }
}

