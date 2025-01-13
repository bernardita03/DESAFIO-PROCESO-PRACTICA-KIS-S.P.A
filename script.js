// Importa el cliente de Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Configuración de Supabase
const SUPABASE_URL = 'https://oxeewnlvbqjpjkwdkoyf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZWV3bmx2YnFqcGprd2Rrb3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MjMyNTMsImV4cCI6MjA1MjE5OTI1M30.wnWPkLiAIKdZgVZeESmZlmha0RVRca32veWkEnQIEZA';

// Inicializa el cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos de la interfaz
const tableList = document.getElementById('table-list');
const tableHeaders = document.getElementById('table-headers');
const tableBody = document.getElementById('table-body');
const filterZone = document.getElementById('filter-zone');
const clearButton = document.getElementById('clear-button');

// Variables globales
let activeTable = '';
let selectedFields = [];
let appliedFilters = [];

// Cargar tablas y campos
const loadTablesAndFields = async () => {
  try {
    const { data: tables, error } = await supabase.rpc('get_tables');
    if (error) throw error;

    tableList.innerHTML = '';
    tables.forEach(async (table) => {
      const tableDiv = document.createElement('div');
      tableDiv.className = 'table-item';

      const tableName = document.createElement('div');
      tableName.className = 'table-name';
      tableName.textContent = table.name;

      const fieldsContainer = document.createElement('div');
      fieldsContainer.className = 'fields-container';

      const { data: fields, error: fieldsError } = await supabase.rpc('get_columns', { table_name: table.name });
      if (fieldsError) throw fieldsError;

      fields.forEach((field) => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'field-item';
        fieldDiv.draggable = true;
        fieldDiv.textContent = field.column_name;

        fieldDiv.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('field', field.column_name);
          e.dataTransfer.setData('table', table.name);
        });

        fieldsContainer.appendChild(fieldDiv);
      });

      tableDiv.appendChild(tableName);
      tableDiv.appendChild(fieldsContainer);
      tableList.appendChild(tableDiv);
    });
  } catch (err) {
    console.error('Error al cargar tablas y campos:', err);
  }
};

// Cargar datos en la tabla
const loadTableData = async () => {
  if (!activeTable || selectedFields.length === 0) return;

  try {
    let query = supabase.from(activeTable).select(selectedFields.join(','));

    // Aplicar filtros
    appliedFilters.forEach(({ field, value }) => {
      query = query.eq(field, value);
    });

    const { data, error } = await query;
    if (error) throw error;

    tableHeaders.innerHTML = '';
    tableBody.innerHTML = '';

    selectedFields.forEach((field) => {
      const th = document.createElement('th');
      th.textContent = field;
      tableHeaders.appendChild(th);
    });

    data.forEach((row) => {
      const tr = document.createElement('tr');
      selectedFields.forEach((field) => {
        const td = document.createElement('td');
        td.textContent = row[field] || 'N/A';
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error al cargar datos:', err);
  }
};

// Configuración de Drag and Drop para la grilla
const gridZone = document.getElementById('grid-zone');
gridZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  gridZone.classList.add('dragover');
});

gridZone.addEventListener('dragleave', () => {
  gridZone.classList.remove('dragover');
});

gridZone.addEventListener('drop', (e) => {
  e.preventDefault();
  gridZone.classList.remove('dragover');

  const field = e.dataTransfer.getData('field');
  const table = e.dataTransfer.getData('table');

  if (!activeTable) {
    activeTable = table;
  } else if (activeTable !== table) {
    alert('Los campos deben ser de la misma tabla.');
    return;
  }

  if (!selectedFields.includes(field)) {
    selectedFields.push(field);
    loadTableData();
  }
});

// Configuración de Drag and Drop para los filtros
filterZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  filterZone.classList.add('dragover');
});

filterZone.addEventListener('dragleave', () => {
  filterZone.classList.remove('dragover');
});

filterZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  filterZone.classList.remove('dragover');

  const field = e.dataTransfer.getData('field');
  const table = e.dataTransfer.getData('table');

  if (!activeTable || activeTable !== table) {
    alert('Selecciona una tabla antes de aplicar filtros.');
    return;
  }

  try {
    const { data, error } = await supabase.from(activeTable).select(field);
    if (error) throw error;

    const uniqueValues = [...new Set(data.map((row) => row[field]))];

    const filterDiv = document.createElement('div');
    filterDiv.className = 'filter-item';
    filterDiv.textContent = `${field}: `;

    const select = document.createElement('select');
    const defaultOption = document.createElement('option');
    defaultOption.textContent = '--Seleccionar--';
    defaultOption.value = '';
    select.appendChild(defaultOption);

    uniqueValues.forEach((value) => {
      const option = document.createElement('option');
      option.textContent = value;
      option.value = value;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      const value = e.target.value;
      const existingFilterIndex = appliedFilters.findIndex((f) => f.field === field);
      if (value && existingFilterIndex === -1) {
        appliedFilters.push({ field, value });
      } else if (existingFilterIndex !== -1) {
        appliedFilters[existingFilterIndex].value = value;
      }
      loadTableData();
    });

    filterDiv.appendChild(select);
    filterZone.appendChild(filterDiv);
  } catch (err) {
    console.error('Error al obtener valores únicos:', err);
  }
});

// Función para limpiar la grilla y los filtros
clearButton.addEventListener('click', () => {
  // Limpiar grilla
  activeTable = '';
  selectedFields = [];
  appliedFilters = [];
  tableHeaders.innerHTML = '';
  tableBody.innerHTML = '';

  // Limpiar filtros
  filterZone.innerHTML = '<p>Arrastra aquí los campos para crear filtros.</p>';
});

// Inicialización
loadTablesAndFields();
