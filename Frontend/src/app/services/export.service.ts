import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
    providedIn: 'root'
})
export class ExportService {

    constructor() { }

    /**
     * Export data to Excel (.xlsx)
     */
    exportToExcel(data: any[], fileName: string): void {
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const workbook: XLSX.WorkBook = {
            Sheets: { 'data': worksheet },
            SheetNames: ['data']
        };
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    }

    /**
     * Export data to PDF (.pdf)
     */
    exportToPDF(headers: string[], data: any[][], fileName: string, title: string): void {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);

        // Add date
        const date = new Date().toLocaleDateString();
        doc.text(`Generated on: ${date}`, 14, 30);

        // Generate table
        autoTable(doc, {
            head: [headers],
            body: data,
            startY: 35,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255] }, // Dark Red matches theme
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`${fileName}.pdf`);
    }
}
