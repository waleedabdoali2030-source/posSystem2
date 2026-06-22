import React, { useState } from 'react';
import { 
  Search, Plus, Edit, Trash2, Grid, List, CheckCircle2, 
  TrendingUp, Box, Layers, Eye, SlidersHorizontal, ArrowUpDown, ChevronDown,
  FileSpreadsheet, Download, Upload
} from 'lucide-react';
import { Product, Category } from '../types';

interface InventoryViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

export default function InventoryView({
  products,
  setProducts,
  categories,
  setCategories
}: InventoryViewProps) {
  // Navigation: Subtabs for inventory
  const [subTab, setSubTab] = useState<'categories' | 'products'>('products');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Dialog & Form states
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatArabic, setNewCatArabic] = useState('');
  const [newCatStatus, setNewCatStatus] = useState<'Active' | 'Draft'>('Active');
  const [newCatFastMover, setNewCatFastMover] = useState(false);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [enableStockCount, setEnableStockCount] = useState(false);
  
  // Excel Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importReport, setImportReport] = useState<{
    success: boolean;
    skuCount: number;
    newCatsCount: number;
    message: string;
  } | null>(null);
  
  // New/Editing Product Form Inputs
  const [prodSku, setProdSku] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodArabicName, setProdArabicName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImage, setProdImage] = useState('');

  // Handle Add Category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatArabic) return;

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName,
      arabicName: newCatArabic,
      skuCount: 0,
      status: newCatStatus,
      isFastMover: newCatFastMover
    };

    setCategories(prev => [...prev, newCategory]);
    // reset
    setNewCatName('');
    setNewCatArabic('');
    setNewCatStatus('Active');
    setNewCatFastMover(false);
    setShowAddCategoryModal(false);
  };

  // Delete Category
  const handleDeleteCategory = (catId: string) => {
    if (confirm('Are you sure you want to delete this category? This will not delete products assigned to it.')) {
      setCategories(prev => prev.filter(c => c.id !== catId));
    }
  };

  // CSV Helper to parse CSV cell
  const escapeCsvCell = (val: any) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  // CSV Helper to split CSV line respecting quotes
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(s => s.trim());
  };

  // EXPORT TO EXCEL/CSV SHEET (UTF-8 with BOM)
  const handleExportToExcel = () => {
    const headers = [
      'SKU',
      'Product Name (English)',
      'Product Name (Arabic)',
      'Price (SAR)',
      'Stock Qty',
      'Category (English)',
      'Category (Arabic)'
    ];

    const rows = products.map(p => {
      const cat = categories.find(c => c.id === p.categoryId);
      const catNameEn = cat ? cat.name : '';
      const catNameAr = cat ? cat.arabicName : '';
      return [
        p.sku,
        p.name,
        p.arabicName,
        p.price,
        p.stock,
        catNameEn,
        catNameAr
      ];
    });

    const csvContent = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map(row => row.map(escapeCsvCell).join(','))
    ].join('\r\n');

    // Unicode BOM for Excel UTF-8 support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mada_pos_inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // DOWNLOAD CSV TEMPLATE
  const handleDownloadTemplate = () => {
    const csvContent = 
      "SKU,Product Name (English),Product Name (Arabic),Price (SAR),Stock Qty,Category (English),Category (Arabic)\r\n" +
      "FB-COF-099,Special Cold Brew,كولد برو مخصوص,18.00,45,Beverages,المشروبات\r\n" +
      "FB-DES-102,Golden Saffron Cake,كعكة الزعفران الذهبية,24.50,15,Desserts,الحلويات\r\n" +
      "FB-MUG-008,Handcrafted Glass Mug,كوب زجاجي مصنوع يدوياً,35.00,0,Ceramics,خزفيات\r\n";
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mada_pos_excel_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // DETAILED PARSER & UPDATER FOR CSV IMPORT
  const handleImportCsv = (fileText: string) => {
    try {
      const lines = fileText.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setImportReport({
          success: false,
          skuCount: 0,
          newCatsCount: 0,
          message: 'The uploaded file is empty or does not contain product data.'
        });
        return;
      }

      // Detect header index
      const firstLineParts = parseCsvLine(lines[0]);
      const hasHeaders = firstLineParts.some(p => 
        p.toLowerCase().includes('sku') || 
        p.toLowerCase().includes('product') || 
        p.toLowerCase().includes('price') || 
        p.toLowerCase().includes('category')
      );

      const startIndex = hasHeaders ? 1 : 0;
      
      const newProductsList = [...products];
      let tempCategories = [...categories];
      let newCatsCreated = 0;

      for (let i = startIndex; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        if (parts.length < 2) continue; // skip invalid short lines

        const sku = parts[0] ? parts[0].trim() : `FB-IMP-${Math.floor(1000 + Math.random() * 9000)}`;
        const nameEn = parts[1] ? parts[1].trim() : 'Imported SKU Item';
        const nameAr = parts[2] ? parts[2].trim() : nameEn;
        const price = parseFloat(parts[3]) || 0;
        const stock = parseInt(parts[4], 10) || 0;
        
        const catNameEn = parts[5] ? parts[5].trim() : 'Uncategorized';
        const catNameAr = parts[6] ? parts[6].trim() : catNameEn;

        // Check if category already exists
        let matchedCat = tempCategories.find(c => c.name.toLowerCase() === catNameEn.toLowerCase());
        
        if (!matchedCat) {
          // Dynamic category creation if it doesn't exist!
          const newCatId = `cat-imp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          matchedCat = {
            id: newCatId,
            name: catNameEn,
            arabicName: catNameAr,
            skuCount: 0,
            status: 'Active',
            isFastMover: false
          };
          tempCategories.push(matchedCat);
          newCatsCreated++;
        }

        // Check SKU duplication to overwrite/update
        const existingProdIdx = newProductsList.findIndex(p => p.sku === sku);

        const statusVal: 'In Stock' | 'Low Stock' | 'Out of Stock' = 
          stock === 0 ? 'Out of Stock' : (stock <= 15 ? 'Low Stock' : 'In Stock');

        const newProduct: Product = {
          id: existingProdIdx >= 0 ? newProductsList[existingProdIdx].id : `prod-imp-${Date.now()}-${i}-${Math.floor(Math.random()*1000)}`,
          sku,
          name: nameEn,
          arabicName: nameAr,
          price,
          categoryId: matchedCat.id,
          stock,
          status: statusVal,
          image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80'
        };

        if (existingProdIdx >= 0) {
          newProductsList[existingProdIdx] = newProduct;
        } else {
          newProductsList.push(newProduct);
        }
      }

      // Re-calculate skuCounts for all categories
      const finalCategories = tempCategories.map(c => {
        const count = newProductsList.filter(p => p.categoryId === c.id).length;
        return {
          ...c,
          skuCount: count
        };
      });

      setProducts(newProductsList);
      setCategories(finalCategories);

      setImportReport({
        success: true,
        skuCount: lines.length - startIndex,
        newCatsCount: newCatsCreated,
        message: `Successfully processed ${lines.length - startIndex} items from Excel sheet. Dynamically registered ${newCatsCreated} new categories.`
      });

    } catch (err: any) {
      setImportReport({
        success: false,
        skuCount: 0,
        newCatsCount: 0,
        message: `Import failed: ${err.message || 'Check your file format.'}`
      });
    }
  };

  const readAndParseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleImportCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const file = e.dataTransfer.files[0];
    if (file) {
      readAndParseFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readAndParseFile(file);
    }
  };

  // Trigger Edit product modal
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdSku(prod.sku);
    setProdName(prod.name);
    setProdArabicName(prod.arabicName);
    setProdPrice(prod.price.toString());
    setProdCategory(prod.categoryId);
    setProdStock(prod.stock.toString());
    setProdImage(prod.image);
    setEnableStockCount(false);
    setShowAddProductModal(true);
  };

  // Trigger Add product modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdSku(`FB-NEW-${Math.floor(100 + Math.random() * 900)}`);
    setProdName('');
    setProdArabicName('');
    setProdPrice('');
    setProdCategory(categories[0]?.id || '');
    setProdStock('0');
    setProdImage('https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80');
    setEnableStockCount(false);
    setShowAddProductModal(true);
  };

  // Handle Save Product (Add or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodSku || !prodPrice) return;

    const priceNum = parseFloat(prodPrice) || 0;
    const stockNum = parseInt(prodStock, 10) || 0;
    let statusVal: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (stockNum === 0) statusVal = 'Out of Stock';
    else if (stockNum <= 15) statusVal = 'Low Stock';

    if (editingProduct) {
      // Edit
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? {
              ...p,
              sku: prodSku,
              name: prodName,
              arabicName: prodArabicName,
              price: priceNum,
              categoryId: prodCategory,
              stock: stockNum,
              status: statusVal,
              image: prodImage
            }
          : p
      ));
    } else {
      // Add new
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        sku: prodSku,
        name: prodName,
        arabicName: prodArabicName,
        price: priceNum,
        categoryId: prodCategory,
        stock: stockNum,
        status: statusVal,
        image: prodImage
      };
      setProducts(prev => [newProd, ...prev]);

      // update sku count on category
      setCategories(prev => prev.map(c => 
        c.id === prodCategory 
          ? { ...c, skuCount: c.skuCount + 1 } 
          : c
      ));
    }

    setShowAddProductModal(false);
    setEditingProduct(null);
  };

  // Handle Delete Product
  const handleDeleteProduct = (productId: string, categoryId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      setCategories(prev => prev.map(c => 
        c.id === categoryId 
          ? { ...c, skuCount: Math.max(0, c.skuCount - 1) } 
          : c
      ));
    }
  };

  // Search and filter logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.arabicName.includes(searchQuery) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || p.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="inventory-workspace">
      
      {/* Search Filter Head Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5" id="inventory-head">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-display">Store inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure your categories, tax codes, product stocks and clearances.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setSubTab('products')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              subTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Product List
          </button>
          <button
            onClick={() => setSubTab('categories')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              subTab === 'categories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Category Management
          </button>
        </div>
      </div>

      {/* ==================================== */}
      {/* 1. PRODUCT WORKSPACE subtab         */}
      {/* ==================================== */}
      {subTab === 'products' && (
        <div className="space-y-4" id="products-subtab-container">
          
          {/* Top Stats Cards Panel (Screen 8) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-slate-100 p-4 rounded-xl shadow-2xs" id="product-stats">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
                <Box className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Products</p>
                <h3 className="text-sm font-black text-slate-950 font-mono mt-0.5">{products.length} <span className="text-[10px] text-slate-400">SKUs</span></h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
                <Box className="w-5 h-5 text-rose-650" />
              </span>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Out of Stock</p>
                <h3 className="text-sm font-black text-rose-650 font-mono mt-0.5">
                  {products.filter(p => p.stock === 0).length} <span className="text-[10px] text-rose-400">Alerts</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                <Layers className="w-5 h-5 text-emerald-650" />
              </span>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Categories</p>
                <h3 className="text-sm font-black text-emerald-650 font-mono mt-0.5">{categories.length}</h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-slate-900 rounded-lg text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </span>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ZATCA Sync Status</p>
                <h3 className="text-sm font-black text-emerald-400 font-mono mt-0.5">100% Compliant</h3>
              </div>
            </div>
          </div>

          {/* Filtering Actions Panel */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between" id="product-filters-bar">
            {/* Search, Status, Categories */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="flex items-center gap-2 border bg-white rounded-lg px-2.5 py-1.5 shadow-2xs w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter name, Arabic name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="outline-hidden text-xs text-slate-700 w-full"
                />
              </div>

              {/* Status Filter pill options */}
              <div className="inline-flex border bg-white rounded-lg p-0.5">
                {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md whitespace-nowrap ${
                      statusFilter === st 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Category Dropdown category filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-700 cursor-pointer shadow-2xs hover:bg-slate-50"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Quick Layout switches + Add product action */}
            <div className="flex items-center justify-between lg:justify-end gap-2 pr-0 lg:pr-1">
              <div className="flex items-center gap-1 border bg-white rounded-lg p-0.5 shadow-2xs">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-450 hover:text-slate-900'}`}
                  title="Table layout"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-450 hover:text-slate-900'}`}
                  title="Grid cards layout"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleExportToExcel}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs transition duration-150 cursor-pointer"
                title="Export list to Excel .csv"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>

              <button
                onClick={() => {
                  setImportReport(null);
                  setShowImportModal(true);
                }}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs transition duration-150 cursor-pointer"
                title="Import Excel file"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="hidden sm:inline">Import Excel</span>
              </button>

              <button
                onClick={handleOpenAddProduct}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition duration-150 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>+ Add Product</span>
              </button>
            </div>
          </div>

          {/* Core lists container */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border rounded-xl py-12 text-center" id="empty-products">
              <Box className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-bold text-sm">No inventory items match search criteria</p>
              <button 
                onClick={() => { setSearchQuery(''); setStatusFilter('All'); setCategoryFilter('All'); }}
                className="text-xs text-emerald-600 hover:underline font-bold mt-1"
              >
                Reset current search filters
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* Table listing (Screen 8) */
            <div className="bg-white border border-slate-100 rounded-xl shadow-2xs overflow-x-auto" id="products-table">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-450 uppercase font-black tracking-widest text-[10px] border-b border-slate-100">
                    <th className="py-3 px-4">SKU / الرمز</th>
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Price (SAR)</th>
                    <th className="py-3 px-4 text-center">Stock</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map((prod) => {
                    const cat = categories.find(c => c.id === prod.categoryId);
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400 uppercase">
                          {prod.sku}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={prod.image} 
                              alt={prod.name} 
                              className="w-10 h-10 rounded-md object-cover bg-slate-100 shadow-2xs"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-extrabold text-slate-900 text-xs">{prod.name}</p>
                              <p className="text-[10px] text-slate-400" dir="rtl">{prod.arabicName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">
                          {cat ? cat.name : 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                          {prod.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold font-semibold text-slate-600">
                          {prod.stock === 0 ? (
                            <span className="text-slate-400">0 Items</span>
                          ) : (
                            <span>{prod.stock} Units</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {prod.status === 'In Stock' && (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                              In Stock
                            </span>
                          )}
                          {prod.status === 'Low Stock' && (
                            <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-100">
                              Low Stock
                            </span>
                          )}
                          {prod.status === 'Out of Stock' && (
                            <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100">
                              Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-950 transition"
                              title="Edit product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.categoryId)}
                              className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards listing (Screen 9) */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" id="products-grid">
              {filteredProducts.map((prod) => {
                const cat = categories.find(c => c.id === prod.categoryId);
                return (
                  <div key={prod.id} className="bg-white border rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between group hover:border-slate-350 transition relative">
                    <div className="aspect-4/3 bg-slate-100 relative">
                      <img 
                        src={prod.image} 
                        alt={prod.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-1.5 right-1.5 bg-slate-900/80 text-white text-[8px] font-mono px-1 py-0.5 rounded">
                        {prod.sku}
                      </span>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        {cat && (
                          <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wider">
                            {cat.name}
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">{prod.name}</h4>
                        <p className="text-[10px] text-slate-400 text-right mt-0.5" dir="rtl">{prod.arabicName}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-mono">Stock: <strong className="text-slate-700 font-bold">{prod.stock}</strong></span>
                        <span className="text-xs font-black text-slate-950 font-mono">{prod.price.toFixed(2)} <span className="text-[9px] text-slate-400 font-medium font-sans">SAR</span></span>
                      </div>

                      <div className="flex gap-1 pt-1.5 border-t border-slate-50">
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className="flex-1 py-1 text-[10px] font-bold border rounded bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border-slate-250 flex items-center justify-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.categoryId)}
                          className="p-1 border border-rose-200 text-rose-500 rounded bg-rose-50/50 hover:bg-rose-100 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================== */}
      {/* 2. CATEGORY WORKSPACE subtab         */}
      {/* ==================================== */}
      {subTab === 'categories' && (
        <div className="space-y-4 animate-fade-in" id="categories-subtab-container">
          
          {/* Top category stats cards (Screen 1) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-slate-100 p-4 rounded-xl shadow-2xs" id="category-stats">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Categories</p>
              <h3 className="text-lg font-black text-slate-950 font-mono mt-0.5">{categories.length}</h3>
              <p className="text-[9px] text-slate-400 mt-1">Tax organized segments</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Products</p>
              <h3 className="text-lg font-black text-slate-950 font-mono mt-0.5">{products.length}</h3>
              <p className="text-[9px] text-slate-400 mt-1">Registered SKUs total</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Category</p>
              <h3 className="text-lg font-black text-emerald-650 font-sans mt-0.5">Food & Bev</h3>
              <p className="text-[9px] text-slate-400 mt-1">Fastest turnover speed</p>
            </div>

            <div className="border border-emerald-100 bg-emerald-50/20 rounded-lg p-2 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">ZATCA Compliant</p>
                <h4 className="text-xs font-black text-emerald-700">ALL VERIFIED</h4>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center" id="categories-toolbar">
            <span className="text-xs text-slate-500 font-semibold">Organize your store inventory into logical tax-compliant groups.</span>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Category</span>
            </button>
          </div>

          {/* Grid of Categories (Screen 1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5" id="categories-grid">
            {categories.map((cat) => {
              const assignedSKUs = products.filter(p => p.categoryId === cat.id).length;
              return (
                <div 
                  key={cat.id} 
                  className={`bg-white border p-4.5 rounded-xl shadow-2xs hover:shadow-xs transition relative group flex flex-col justify-between min-h-[140px] ${
                    cat.status === 'Draft' ? 'border-dashed border-slate-250 bg-slate-50/20' : 'border-slate-200'
                  }`}
                  id={`cat-card-${cat.id}`}
                >
                  <div>
                    {/* Header line with badge indicator */}
                    <div className="flex justify-between items-start">
                      <span className="p-2 bg-slate-100 rounded-lg text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition duration-200">
                        <Layers className="w-4 h-4" />
                      </span>
                      
                      <div className="flex gap-1.5">
                        {cat.isFastMover && (
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">
                            Fast Mover
                          </span>
                        )}
                        <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded ${
                          cat.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {cat.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3.5">
                      <h4 className="text-sm font-black text-slate-900">{cat.name}</h4>
                      <h5 className="text-xs text-slate-400 font-bold text-right" dir="rtl">{cat.arabicName}</h5>
                    </div>
                  </div>

                  {/* Actions & stats footer */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">
                      {assignedSKUs} Registered SKUs
                    </span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dotted Box template for Adding New category */}
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-100/30 transition rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 min-h-[140px] cursor-pointer"
            >
              <Plus className="w-6 h-6 text-slate-300 mb-1" />
              <span className="text-xs font-extrabold tracking-tight">Create New Category</span>
              <span className="text-[9px] text-slate-400 mt-1">Organize new item catalogs</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DIALOGS                              */}
      {/* ========================================== */}

      {/* 1. Add Category Modal popup */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-3xs flex items-center justify-center p-4" id="category-modal-overlay">
          <div className="bg-white text-slate-900 border rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in" id="category-modal">
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-900 tracking-wide">Add New Category</span>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Category English Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Beverages"
                  className="w-full text-xs border rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Arabic Name / الإسم بالعربية</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: المشروبات"
                  className="w-full text-xs border rounded-lg p-2 text-right focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  value={newCatArabic}
                  onChange={(e) => setNewCatArabic(e.target.value)}
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Status</label>
                  <select
                    className="w-full text-xs border rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    value={newCatStatus}
                    onChange={(e) => setNewCatStatus(e.target.value as any)}
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                <div className="flex items-center pt-5 pl-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 rounded" 
                      checked={newCatFastMover}
                      onChange={(e) => setNewCatFastMover(e.target.checked)}
                    />
                    <span className="text-[10px] text-slate-600 font-bold uppercase">Fast Mover</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase rounded-lg tracking-wider transition active:scale-98"
              >
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add / Edit Product Multi Form Drawer (Screen 11/8/9 detail editing) */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-3xs flex items-center justify-center p-4 overflow-y-auto" id="product-modal-overlay">
          <div className="bg-white text-slate-900 border rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in my-8" id="product-modal">
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-900 tracking-wide">
                {editingProduct ? 'Modify Inventory SKU' : 'Add New SKU'}
              </span>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">SKU Code / الباركود</label>
                  <input 
                    type="text" 
                    required
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full text-xs border rounded-lg p-2 font-mono font-bold uppercase focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Tax Category Group</label>
                  <select
                    className="w-full text-xs border rounded-lg p-2 font-bold text-slate-700"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">SKU Display Name (English)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. French Press Coffee Maker"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Arabic Name / الإسم بالعربية</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: الة قهوة فرنسية"
                  value={prodArabicName}
                  onChange={(e) => setProdArabicName(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2 font-bold text-right"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Selling Price (Inc VAT)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">SAR</span>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full text-xs border rounded-lg p-2 pl-10 text-right font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] text-slate-500 font-extrabold uppercase">Initial Stock quantity</label>
                    <label className="flex items-center gap-1 cursor-pointer text-[9px] text-emerald-600 font-bold hover:text-emerald-500 select-none" title="Check this box to manually count or adjust stock level">
                      <input 
                        type="checkbox" 
                        className="accent-emerald-600 rounded w-3 h-3" 
                        checked={enableStockCount}
                        onChange={(e) => setEnableStockCount(e.target.checked)}
                      />
                      <span>Adjust Stock</span>
                    </label>
                  </div>
                  <input 
                    type="number" 
                    required
                    disabled={!enableStockCount}
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className={`w-full text-xs border rounded-lg p-2 font-mono font-bold text-center transition-all ${
                      !enableStockCount 
                        ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed select-none animate-pulse-subtle' 
                        : 'bg-white border-slate-300 text-slate-800 focus:ring-1 focus:ring-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Product Media URL</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..."
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2 text-slate-500 font-mono"
                />
              </div>

              {/* Security tax disclaimer */}
              <div className="p-3 bg-emerald-50 rounded border border-emerald-100 flex items-start gap-1.5 text-[9.5px] text-emerald-800 leading-normal">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <p>
                  Saving this product registers it to local tax lists automatically, calculating <strong>15% simplified VAT value</strong> at point of transaction checkout.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2.5 border rounded-lg text-xs font-extrabold uppercase text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase rounded-lg tracking-wider shadow-md transition active:scale-98"
                >
                  {editingProduct ? 'Update SKU Details' : '+ Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CSV/Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-3xs flex items-center justify-center p-4 overflow-y-auto" id="import-excel-modal-overlay">
          <div className="bg-white text-slate-900 border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in my-8" id="import-excel-modal">
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-900 tracking-wide flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Import Inventory from Excel</span>
              </span>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                <p>
                  You can batch import products directly from a Microsoft Excel sheet or Google Sheets formatted as a <strong>CSV file (.csv)</strong>.
                </p>
                <p className="bg-amber-50 text-amber-800 border border-amber-200/50 p-2.5 rounded-lg text-[11px] font-medium leading-relaxed">
                  💡 <strong>Dynamic Category Creation:</strong> If you specify a category name in the sheet that does not exist in your POS system, it will be <strong>automatically and dynamically created</strong> instantly!
                </p>
              </div>

              {/* Sample Template Section */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800">Need the correct column structure?</h4>
                  <p className="text-[10px] text-slate-500">Download our pre-structured Excel-ready template containing headers.</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  type="button"
                  className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-[10px] uppercase px-3 py-2 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Get Template</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragOver 
                    ? 'border-emerald-500 bg-emerald-50/50 scale-99' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <label className="cursor-pointer flex flex-col items-center justify-center space-y-2 w-full h-full">
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={handleFileSelect} 
                  />
                  <div className="p-3 bg-slate-100 rounded-full text-slate-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Drag & drop your .csv file here, or <span className="text-emerald-600 hover:underline">browse files</span></p>
                    <p className="text-[10px] text-slate-400">Supported: standard CSV format with headers</p>
                  </div>
                </label>
              </div>

              {/* Report feedback panel */}
              {importReport && (
                <div className={`p-4 rounded-xl border leading-relaxed ${
                  importReport.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${importReport.success ? 'text-emerald-600' : 'text-rose-600'}`} />
                    <div className="space-y-1 text-xs">
                      <p className="font-extrabold">{importReport.success ? 'Import Completed Successfully!' : 'Import Failed'}</p>
                      <p className="text-[11px] text-slate-650">{importReport.message}</p>
                      
                      {importReport.success && (
                        <div className="grid grid-cols-2 gap-2 mt-2 bg-white/50 border border-emerald-200/40 p-2 rounded-lg font-mono text-[10px]">
                          <div>📥 Loaded SKUs: <strong className="font-extrabold text-slate-850">{importReport.skuCount}</strong></div>
                          <div>🏷️ New Categories: <strong className="font-extrabold text-slate-850">{importReport.newCatsCount}</strong></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportReport(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 transition text-slate-700 font-bold text-xs uppercase rounded-lg tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple absolute cross-button to close
interface XProps {
  className?: string;
}
function X({ className }: XProps) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
