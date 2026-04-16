import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, FileSpreadsheet, Table as TableIcon, Calendar } from 'lucide-react';
import { useListingData, ListingFilters, ListingItem } from '@/hooks/useListingData';
import { useInscriptionPeriods } from '@/hooks/useInscriptionPeriods';
import { ListingTable } from './ListingTable';

const PDF_COLUMNS = [
  { header: '#', key: 'order' },
  { header: 'Apellido y Nombre', key: 'teacher_name' },
  { header: 'DNI', key: 'teacher_dni' },
  { header: 'Tipo', key: 'title_type' },
  { header: 'Tít.', key: 'titulo_score' },
  { header: 'Ant.Tít.', key: 'antiguedad_titulo_score' },
  { header: 'Ant.Doc.', key: 'antiguedad_docente_score' },
  { header: 'Conc.', key: 'concepto_score' },
  { header: 'Prom.', key: 'promedio_titulo_score' },
  { header: 'T.Pub.', key: 'trabajo_publico_score' },
  { header: 'Becas', key: 'becas_otros_score' },
  { header: 'Conc.', key: 'concurso_score' },
  { header: 'Otros', key: 'otros_antecedentes_score' },
  { header: 'R.Fed.', key: 'red_federal_score' },
  { header: 'TOTAL', key: 'total_score' },
];

const fmtScore = (v: number | null | undefined) =>
  v !== null && v !== undefined ? Number(v).toFixed(2) : '--';

const titleTypeLabel = (item: ListingItem) => {
  const s = item.titulo_score;
  if (s !== null && s !== undefined) {
    if (s >= 8.5) return 'Doc';
    if (s >= 5.5) return 'Hab';
    if (s >= 2.5) return 'Sup';
  }
  switch (item.title_type) {
    case 'docente': return 'Doc';
    case 'habilitante': return 'Hab';
    case 'supletorio': return 'Sup';
    default: return '--';
  }
};

const sanitize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface Props {
  selectedPeriodId?: string;
}

export const ListingGenerator: React.FC<Props> = ({ selectedPeriodId }) => {
  const { listings, schools, subjects, positions, loading, error, fetchListings } = useListingData();
  const { periods } = useInscriptionPeriods();
  const [periodId, setPeriodId] = useState<string>('');
  const [filters, setFilters] = useState<ListingFilters>({
    schoolId: 'all',
    listingType: 'all',
    evaluationStatus: 'all'
  });

  const handleFilterChange = (key: keyof ListingFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset specific item when changing listing type
    if (key === 'listingType') {
      delete newFilters.specificItemId;
    }
    
    setFilters(newFilters);
  };

  const generateListings = () => {
    if (!periodId) return;
    const filtersWithPeriod = { ...filters, periodId };
    fetchListings(filtersWithPeriod);
  };


  const getAvailableItems = () => {
    if (filters.listingType === 'specific-subject') {
      return subjects.filter(s => filters.schoolId === 'all' || s.school_id === filters.schoolId);
    }
    if (filters.listingType === 'specific-position') {
      return positions.filter(p => filters.schoolId === 'all' || p.school_id === filters.schoolId);
    }
    return [];
  };

  const needsSpecificSelection = filters.listingType === 'specific-subject' || filters.listingType === 'specific-position';
  const canGenerate = periodId && (!needsSpecificSelection || filters.specificItemId);
  const selectedPeriod = periods.find(p => p.id === periodId);

  const groupListingsForExport = () => {
    // Group by school -> section (Materias/Cargos) -> item_name -> title type
    const groups: Record<string, { subjects: Record<string, Record<string, ListingItem[]>>; positions: Record<string, Record<string, ListingItem[]>> }> = {};
    listings.forEach((item) => {
      if (!groups[item.school_name]) groups[item.school_name] = { subjects: {}, positions: {} };
      const tt = titleTypeLabel(item);
      if (item.item_type === 'subject') {
        if (!groups[item.school_name].subjects[item.item_name]) groups[item.school_name].subjects[item.item_name] = {};
        if (!groups[item.school_name].subjects[item.item_name][tt]) groups[item.school_name].subjects[item.item_name][tt] = [];
        groups[item.school_name].subjects[item.item_name][tt].push(item);
      } else {
        if (!groups[item.school_name].positions[item.item_name]) groups[item.school_name].positions[item.item_name] = {};
        if (!groups[item.school_name].positions[item.item_name][tt]) groups[item.school_name].positions[item.item_name][tt] = [];
        groups[item.school_name].positions[item.item_name][tt].push(item);
      }
    });
    return groups;
  };

  const handleExportPDF = () => {
    if (listings.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const generatedAt = new Date().toLocaleString('es-AR');

    // Header (only first page; subsequent sections add their own subheaders)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Listado de Mérito', pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const meta: string[] = [];
    if (selectedPeriod) meta.push(`Período: ${selectedPeriod.name}`);
    if (filters.schoolId !== 'all') {
      const s = schools.find((x) => x.id === filters.schoolId);
      if (s) meta.push(`Escuela: ${s.name}`);
    }
    meta.push(`Generado: ${generatedAt}`);
    doc.text(meta.join('  •  '), pageWidth / 2, 18, { align: 'center' });

    let cursorY = 24;
    const groups = groupListingsForExport();

    const drawSectionTitle = (text: string, size = 11) => {
      if (cursorY > 180) {
        doc.addPage();
        cursorY = 15;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.text(text, 10, cursorY);
      cursorY += 2;
    };

    const drawTable = (items: ListingItem[]) => {
      const body = items.map((item, idx) => [
        String(idx + 1),
        item.teacher_name,
        item.teacher_dni,
        titleTypeLabel(item),
        fmtScore(item.titulo_score),
        fmtScore(item.antiguedad_titulo_score),
        fmtScore(item.antiguedad_docente_score),
        fmtScore(item.concepto_score),
        fmtScore(item.promedio_titulo_score),
        fmtScore(item.trabajo_publico_score),
        fmtScore(item.becas_otros_score),
        fmtScore(item.concurso_score),
        fmtScore(item.otros_antecedentes_score),
        fmtScore(item.red_federal_score),
        fmtScore(item.total_score),
      ]);
      autoTable(doc, {
        startY: cursorY + 2,
        head: [PDF_COLUMNS.map((c) => c.header)],
        body,
        styles: { fontSize: 7, cellPadding: 1.2, overflow: 'linebreak' },
        headStyles: { fillColor: [60, 60, 60], textColor: 255, fontSize: 7, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 55 },
          2: { cellWidth: 20 },
          3: { cellWidth: 12, halign: 'center' },
          14: { fontStyle: 'bold', halign: 'center' },
        },
        margin: { left: 8, right: 8 },
        theme: 'grid',
      });
      // @ts-ignore - lastAutoTable is added by the plugin
      cursorY = (doc as any).lastAutoTable.finalY + 4;
    };

    Object.entries(groups).forEach(([schoolName, schoolData], schoolIdx) => {
      if (schoolIdx > 0) {
        doc.addPage();
        cursorY = 15;
      }
      drawSectionTitle(schoolName, 13);

      if (Object.keys(schoolData.subjects).length > 0) {
        drawSectionTitle('MATERIAS', 11);
        Object.keys(schoolData.subjects).sort().forEach((subjectName) => {
          const byType = schoolData.subjects[subjectName];
          Object.keys(byType).forEach((tt) => {
            drawSectionTitle(`${subjectName.toUpperCase()} — ${tt}`, 9);
            drawTable(byType[tt]);
          });
        });
      }

      if (Object.keys(schoolData.positions).length > 0) {
        drawSectionTitle('CARGOS ADMINISTRATIVOS', 11);
        Object.keys(schoolData.positions).sort().forEach((positionName) => {
          const byType = schoolData.positions[positionName];
          Object.keys(byType).forEach((tt) => {
            drawSectionTitle(`${positionName.toUpperCase()} — ${tt}`, 9);
            drawTable(byType[tt]);
          });
        });
      }
    });

    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 10, doc.internal.pageSize.getHeight() - 6, { align: 'right' });
    }

    const periodSlug = sanitize(selectedPeriod?.name || 'periodo');
    const dateSlug = new Date().toISOString().slice(0, 10);
    doc.save(`listado-merito-${periodSlug}-${dateSlug}.pdf`);
  };

  const handleExportCSV = () => {
    if (listings.length === 0) return;
    const headers = ['Escuela', 'Sección', 'Item', 'Tipo Título', '#', ...PDF_COLUMNS.slice(1).map((c) => c.header)];
    const groups = groupListingsForExport();
    const rows: string[][] = [];

    const pushRows = (
      schoolName: string,
      section: string,
      itemName: string,
      tt: string,
      items: ListingItem[]
    ) => {
      items.forEach((item, idx) => {
        rows.push([
          schoolName,
          section,
          itemName,
          tt,
          String(idx + 1),
          item.teacher_name,
          item.teacher_dni,
          titleTypeLabel(item),
          fmtScore(item.titulo_score),
          fmtScore(item.antiguedad_titulo_score),
          fmtScore(item.antiguedad_docente_score),
          fmtScore(item.concepto_score),
          fmtScore(item.promedio_titulo_score),
          fmtScore(item.trabajo_publico_score),
          fmtScore(item.becas_otros_score),
          fmtScore(item.concurso_score),
          fmtScore(item.otros_antecedentes_score),
          fmtScore(item.red_federal_score),
          fmtScore(item.total_score),
        ]);
      });
    };

    Object.entries(groups).forEach(([schoolName, schoolData]) => {
      Object.keys(schoolData.subjects).sort().forEach((subjectName) => {
        const byType = schoolData.subjects[subjectName];
        Object.keys(byType).forEach((tt) => pushRows(schoolName, 'Materia', subjectName, tt, byType[tt]));
      });
      Object.keys(schoolData.positions).sort().forEach((positionName) => {
        const byType = schoolData.positions[positionName];
        Object.keys(byType).forEach((tt) => pushRows(schoolName, 'Cargo', positionName, tt, byType[tt]));
      });
    });

    const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    // BOM for Excel UTF-8
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const periodSlug = sanitize(selectedPeriod?.name || 'periodo');
    const dateSlug = new Date().toISOString().slice(0, 10);
    a.download = `listado-merito-${periodSlug}-${dateSlug}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            Generador de Listados de Mérito
          </CardTitle>
          <CardDescription>
            Configure los filtros para generar listados personalizados por escuela
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Period Filter - MANDATORY */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período <span className="text-destructive">*</span>
              </label>
              <Select value={periodId} onValueChange={setPeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* School Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Escuela</label>
              <Select value={filters.schoolId} onValueChange={(value) => handleFilterChange('schoolId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar escuela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las escuelas</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Listing Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de listado</label>
              <Select value={filters.listingType} onValueChange={(value) => handleFilterChange('listingType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de listado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo (materias y cargos)</SelectItem>
                  <SelectItem value="subjects">Solo materias</SelectItem>
                  <SelectItem value="positions">Solo cargos</SelectItem>
                  <SelectItem value="specific-subject">Materia específica</SelectItem>
                  <SelectItem value="specific-position">Cargo específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific Item Filter */}
            {needsSpecificSelection && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {filters.listingType === 'specific-subject' ? 'Materia' : 'Cargo'}
                </label>
                <Select value={filters.specificItemId || ''} onValueChange={(value) => handleFilterChange('specificItemId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Seleccionar ${filters.listingType === 'specific-subject' ? 'materia' : 'cargo'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableItems().map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} {item.schools && `(${item.schools.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Evaluation Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado de evaluación</label>
              <Select value={filters.evaluationStatus} onValueChange={(value) => handleFilterChange('evaluationStatus', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Solo evaluados</SelectItem>
                  <SelectItem value="draft">Solo pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateListings} 
              disabled={!canGenerate || loading}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {loading ? 'Generando...' : 'Generar Listado'}
            </Button>
            
            {listings.length > 0 && (
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {listings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Listado de Mérito - Formato Grilla de Evaluación</CardTitle>
            <CardDescription>
              {listings.length} {listings.length === 1 ? 'inscripción encontrada' : 'inscripciones encontradas'}
              {selectedPeriod && ` • Período: ${selectedPeriod.name}`}
              {' • '}
              Generado el {new Date().toLocaleDateString('es-AR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ListingTable listings={listings} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};