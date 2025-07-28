import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface Event {
  id: string;
  title: string;
  community: string;
  type: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  datetime: string;
  end_datetime?: string;
  end_date?: string;
  suggested_datetime?: string;
  suggested_end_datetime?: string;
  suggestion_reason?: string;
}

interface MonthData {
  month: Date;
  events: Event[];
  label: string;
}

interface ExportButtonsProps {
  events: Event[];
}

export const ExportButtons = ({ events }: ExportButtonsProps) => {
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // Filter events for current and future months only
    const currentDate = new Date();
    const futureEvents = events.filter(event => {
      const eventDate = new Date(event.datetime);
      return eventDate >= currentDate;
    });
    
    // Clean header with gradient background
    doc.setFillColor(59, 130, 246); // Blue-500
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // White title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('EventSync TocH', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Event Management Report', pageWidth / 2, 35, { align: 'center' });
    
    let yPosition = 70;
    
    // Summary cards
    const cardWidth = (pageWidth - 3 * margin) / 2;
    const cardHeight = 35;
    
    // Total events card
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPosition, cardWidth, cardHeight, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.rect(margin, yPosition, cardWidth, cardHeight);
    
    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(futureEvents.length.toString(), margin + 15, yPosition + 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text('Total Events', margin + 15, yPosition + 27);
    
    // Status breakdown card
    const statusCounts = futureEvents.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    doc.setFillColor(241, 245, 249);
    doc.rect(margin + cardWidth + 10, yPosition , cardWidth, cardHeight, 'F');
    doc.rect(margin + cardWidth + 10, yPosition , cardWidth, cardHeight);
    
    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Status Summary', margin + cardWidth + 35, yPosition +5);
    
    let statusY = yPosition + 10;
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (status === 'approved') {
        doc.setFillColor(34, 197, 94);
      } else if (status === 'rejected') {
        doc.setFillColor(239, 68, 68);
      } else {
        doc.setFillColor(245, 158, 11);
      }
      doc.circle(margin + cardWidth + 25, statusY - 2, 2, 'F');
      
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`${status}: ${count}`, margin + cardWidth + 35, statusY);
      statusY += 10;
    });
    
    yPosition += 55;
    
    // Generation date
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Generated: ${currentDate.toLocaleDateString()}`, margin, yPosition);
    
    yPosition += 20;
    
    // Get current and next month only
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const monthsToShow = [currentMonth, nextMonth];
    
    // Group events by month
    const eventsByMonth: Record<string, MonthData> = {};
    
    monthsToShow.forEach(month => {
      const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
      const monthEvents = futureEvents.filter(event => {
        const eventDate = new Date(event.datetime);
        return eventDate.getMonth() === month.getMonth() && 
               eventDate.getFullYear() === month.getFullYear();
      });
      
      eventsByMonth[monthKey] = {
        month,
        events: monthEvents,
        label: month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
    });
    
    // Render each month
    Object.values(eventsByMonth).forEach((monthData, index) => {
      if (index > 0 && yPosition > pageHeight - 150) {
        doc.addPage();
        yPosition = 30;
      }
      
      // Month header
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(monthData.label, margin + 15, yPosition + 12);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`${monthData.events.length} events`, margin + 15, yPosition + 22);
      
      yPosition += 40;
      
      // Calendar grid
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const cellWidth = (pageWidth - 2 * margin) / 7;
      const cellHeight = 20;
      
      // Calendar header
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, cellHeight, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, cellHeight);
      
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      daysOfWeek.forEach((day, index) => {
        doc.text(day, margin + index * cellWidth + cellWidth / 2, yPosition + 12, { align: 'center' });
      });
      
      yPosition += cellHeight;
      
      // Calendar days
      const firstDay = new Date(monthData.month.getFullYear(), monthData.month.getMonth(), 1);
      const lastDay = new Date(monthData.month.getFullYear(), monthData.month.getMonth() + 1, 0);
      const startingDay = firstDay.getDay();
      const numDays = lastDay.getDate();
      
      let currentDay = 1;
      let weekCount = 0;
      
      while (currentDay <= numDays) {
        for (let day = 0; day < 7; day++) {
          const x = margin + day * cellWidth;
          const y = yPosition + weekCount * cellHeight;
          
          if (weekCount % 2 === 0) {
            doc.setFillColor(255, 255, 255);
          } else {
            doc.setFillColor(248, 250, 252);
          }
          doc.rect(x, y, cellWidth, cellHeight, 'F');
          
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.rect(x, y, cellWidth, cellHeight);
          
          if (weekCount === 0 && day < startingDay) {
            continue;
          }
          
          if (currentDay > numDays) {
            break;
          }
          
          doc.setTextColor(51, 65, 85);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(currentDay.toString(), x + 3, y + 10);
          
          // Event indicator
          const dayEvents = monthData.events.filter(event => 
            new Date(event.datetime).getDate() === currentDay
          );
          
          if (dayEvents.length > 0) {
            doc.setFillColor(59, 130, 246);
            doc.circle(x + cellWidth - 8, y + 8, 3, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text(dayEvents.length.toString(), x + cellWidth - 8, y + 10, { align: 'center' });
          }
          
          currentDay++;
        }
        weekCount++;
        
        if (currentDay > numDays) {
          break;
        }
      }
      
      yPosition += weekCount * cellHeight + 20;
      
      // Event details
      if (monthData.events.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(12);
        doc.text('Events This Month', margin, yPosition);
        yPosition += 15;
        
        monthData.events.forEach((event) => {
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 30;
          }
          
          // Event card
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPosition, pageWidth - 2 * margin, 45, 'F');
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.5);
          doc.rect(margin, yPosition, pageWidth - 2 * margin, 45);
          
          // Status stripe
          if (event.status === 'approved') {
            doc.setFillColor(34, 197, 94);
          } else if (event.status === 'rejected') {
            doc.setFillColor(239, 68, 68);
          } else {
            doc.setFillColor(245, 158, 11);
          }
          doc.rect(margin, yPosition, 5, 45, 'F');
          
          // Event title
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 58, 138);
          doc.setFontSize(11);
          doc.text(event.title, margin + 10, yPosition + 10);
          
          // Status badge
          if (event.status === 'approved') {
            doc.setFillColor(34, 197, 94);
          } else if (event.status === 'rejected') {
            doc.setFillColor(239, 68, 68);
          } else {
            doc.setFillColor(245, 158, 11);
          }
          doc.rect(pageWidth - margin - 50, yPosition + 5, 40, 10, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text(event.status.toUpperCase(), pageWidth - margin - 30, yPosition + 12, { align: 'center' });
          
          // Event details
          doc.setTextColor(71, 85, 105);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          
          const startDate = new Date(event.datetime);
          const startTimeStr = startDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          doc.text(`Event Start Date: ${startTimeStr}`, margin + 10, yPosition + 22);
          
          // Show end date if available
          if (event.end_datetime || event.end_date) {
            const endDate = new Date(event.end_datetime || event.end_date!);
            const endTimeStr = endDate.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            doc.text(`Event End Date: ${endTimeStr}`, margin + 10, yPosition + 32);
          }
          
          doc.text(`Community: ${event.community}`, margin + 120, yPosition + 22);
          doc.text(`Event Type: ${event.type}`, margin + 120, yPosition + 32);
          
          yPosition += 55;
        });
      }
      
      yPosition += 20;
    });
    
    // Add page numbers
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      doc.text('EventSync TocH', margin, pageHeight - 10);
    }
    
    doc.save(`eventsync-calendar-${currentDate.toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const currentDate = new Date();
    const futureEvents = events.filter(event => new Date(event.datetime) >= currentDate);
    
    const exportData = futureEvents.map(event => ({
      'Event Name': event.title,
      'Community': event.community,
      'Type': event.type,
      'Start Date & Time': new Date(event.datetime).toLocaleString(),
      'End Date & Time': event.end_datetime || event.end_date ? new Date(event.end_datetime || event.end_date!).toLocaleString() : '',
      'Status': event.status.toUpperCase(),
      'Description': event.description || '',
      'Suggested Start Date/Time': event.suggested_datetime ? new Date(event.suggested_datetime).toLocaleString() : '',
      'Suggested End Date/Time': event.suggested_end_datetime ? new Date(event.suggested_end_datetime).toLocaleString() : '',
      'Suggestion Reason': event.suggestion_reason || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Future Events');
    
    XLSX.writeFile(wb, `eventsync-future-events-${currentDate.toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportToPDF} variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
        <Download className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
      <Button onClick={exportToExcel} variant="outline" className="bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700">
        <Download className="w-4 h-4 mr-2" />
        Export Excel
      </Button>
    </div>
  );
};
