# 🌱 Bharat Pushpam Admin Panel Guide

## 🎯 Overview
Your comprehensive admin panel for managing the Bharat Pushpam e-commerce website. This guide covers all features and functionality.

## 🔐 Admin Access

### **Login Credentials**
- **URL:** http://localhost:3000/admin/login
- **Username:** `admin`
- **Password:** `bharatpushpam2024`

### **Security Note**
In production, change these credentials and implement proper authentication with JWT tokens or OAuth.

## 📊 Dashboard Features

### **Statistics Overview**
- **Total Products:** Count of all products in inventory
- **Categories:** Number of product categories
- **Total Orders:** All orders received
- **Revenue:** Total revenue from paid orders

### **Recent Orders**
- Latest 5 orders with customer details
- Order status and payment information
- Quick access to order management

### **Low Stock Alerts**
- Products with stock below 10 units
- Color-coded alerts (red for critical stock)
- Quick restocking reminders

### **Quick Actions**
- Add New Product
- Add Category
- Manage Orders

## 🛍️ Product Management

### **Product List View**
- **Grid/Table View:** All products with images
- **Search & Filter:** Find products quickly
- **Sort Options:** By name, price, stock, date
- **Bulk Actions:** Select multiple products

### **Product Information**
- **Basic Details:** Name, SKU, description
- **Pricing:** Selling price, MRP, discounts
- **Inventory:** Stock quantity, low stock alerts
- **Categories:** Product categorization
- **Images:** Multiple product photos

### **Adding New Products**

#### **Step 1: Basic Information**
```
Product Name: Monstera Deliciosa
SKU: MONST-001
Description: Beautiful indoor plant perfect for home decoration
```

#### **Step 2: Pricing**
```
Selling Price: ₹299
MRP: ₹399 (optional)
Stock: 50 units
```

#### **Step 3: Category Selection**
- Indoor Plants
- Outdoor Plants
- Succulents & Cactus
- Bonsai
- Herbal & Medicinal
- Fruit Plants
- Fragrant Plants
- Pots & Planters

#### **Step 4: Image Upload**
- Upload multiple images
- First image becomes main product image
- Automatic optimization and resizing
- Cloudinary CDN delivery

### **Product Status Management**
- **Active:** Product is live and available
- **Out of Stock:** Temporarily unavailable
- **Draft:** Not yet published
- **Archived:** Removed from store

## 📦 Order Management

### **Order Status Tracking**
- **PENDING:** Payment not yet received
- **PAID:** Payment confirmed, ready to ship
- **SHIPPED:** Order dispatched
- **DELIVERED:** Order completed
- **CANCELLED:** Order cancelled

### **Order Information**
- **Customer Details:** Name, email, phone
- **Shipping Address:** Complete delivery address
- **Order Items:** Products and quantities
- **Payment Info:** Razorpay transaction details
- **Order Timeline:** Status change history

### **Order Actions**
- **View Details:** Complete order information
- **Update Status:** Change order status
- **Print Invoice:** Generate order receipt
- **Contact Customer:** Email/SMS integration

## 🖼️ Image Management

### **Image Upload**
- **Drag & Drop:** Easy file upload
- **Multiple Files:** Upload several images at once
- **Format Support:** JPG, PNG, WebP
- **Auto Optimization:** Automatic compression and resizing

### **Image Organization**
- **Product Association:** Link images to products
- **Position Control:** Set image order
- **Alt Text:** SEO-friendly descriptions
- **Cloud Storage:** Secure Cloudinary hosting

### **Image Features**
- **Responsive:** Different sizes for different devices
- **Lazy Loading:** Fast page loading
- **CDN Delivery:** Global fast access
- **Backup:** Automatic cloud backup

## 🧩 Product Import/Export (Safe Workflow)

Use this workflow to safely add/update products and categories without risking data loss.

- Database migrations
  - Check status: `npm run migrate:status`
  - Deploy schema changes: `npm run migrate:deploy`
  - Seed base data: `npm run seed`

- Import products from CSV
  - Default file: `npm run import:products` (reads `prisma/products.csv`)
  - Custom file: `npm run import:products:custom -- prisma/your-file.csv`
  - The importer uses upserts for categories and products, so re-runs update safely without duplicates.
  - See `prisma/products.sample.csv` for column examples.

- Upload and sync images
  - Configure Cloudinary via `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - Upload local images: `npm run images:upload`
  - Update DB image references: `npm run images:update-db`

- Backup export before big changes
  - Snapshot current data: `npm run export:backup`
  - Outputs `categories.json`, `products.json`, `product_images.json` in `prisma/exports/<timestamp>/` for rollback/auditing.

### CSV Template
- `slug` – unique product slug
- `name` – product name
- `description` – long description
- `price` – numeric price (in paise)
- `category` – category name (auto-created if missing)
- `image_urls` – comma-separated URLs or Cloudinary public IDs

Importer behavior:
- Upsert categories by name/slug
- Upsert products by `slug`
- Attach images to products (creates `ProductImage` rows)

### Environment
- Database: set `DATABASE_URL`
- Cloudinary: set `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## 🏷️ Category Management

### **Category Structure**
```
Indoor Plants
├── Air Purifying Plants
├── Low Light Plants
└── Flowering Indoor Plants

Outdoor Plants
├── Flowering Plants
├── Fruit Plants
└── Ornamental Plants

Pots & Planters
├── Ceramic Pots
├── Plastic Pots
├── Fiber Pots
└── Decorative Planters
```

### **Category Features**
- **Hierarchical:** Parent-child relationships
- **SEO Friendly:** Custom slugs and descriptions
- **Image Support:** Category banners
- **Product Count:** Automatic counting

## ⚙️ Settings & Configuration

### **Store Settings**
- **Store Name:** Bharat Pushpam
- **Contact Info:** Phone, email, address
- **Social Media:** Instagram, Facebook links
- **Payment Methods:** Razorpay configuration

### **Shipping Settings**
- **Free Delivery:** Minimum order amount (₹999)
- **Delivery Areas:** Serviceable locations
- **Shipping Rates:** Delivery charges
- **Delivery Time:** Estimated delivery periods

### **Email Settings**
- **Order Confirmations:** Automatic emails
- **Shipping Updates:** Delivery notifications
- **Marketing:** Newsletter and promotions
- **Customer Support:** Help and inquiries

## 📈 Analytics & Reports

### **Sales Reports**
- **Daily/Weekly/Monthly:** Sales trends
- **Product Performance:** Best selling items
- **Category Analysis:** Category-wise sales
- **Customer Insights:** Purchase patterns

### **Inventory Reports**
- **Stock Levels:** Current inventory
- **Low Stock Alerts:** Reorder reminders
- **Fast Moving:** High-demand products
- **Slow Moving:** Products needing promotion

## 🔧 Technical Features

### **Security**
- **Admin Authentication:** Secure login system
- **Role-based Access:** Different permission levels
- **Audit Logs:** Track all admin actions
- **Data Backup:** Regular database backups

### **Performance**
- **Image Optimization:** Automatic compression
- **CDN Delivery:** Fast global access
- **Caching:** Improved loading speeds
- **Mobile Responsive:** Works on all devices

### **Integration**
- **Payment Gateway:** Razorpay integration
- **Cloud Storage:** Cloudinary image hosting
- **Email Service:** Transactional emails
- **Analytics:** Google Analytics ready

## 🚀 Best Practices

### **Product Management**
1. **High-Quality Images:** Use well-lit, clear photos
2. **Detailed Descriptions:** Include care instructions
3. **Accurate Pricing:** Keep prices updated
4. **Stock Management:** Monitor inventory levels
5. **SEO Optimization:** Use relevant keywords

### **Order Processing**
1. **Quick Response:** Process orders within 24 hours
2. **Status Updates:** Keep customers informed
3. **Quality Check:** Verify order accuracy
4. **Packaging:** Secure and attractive packaging
5. **Delivery Tracking:** Provide tracking information

### **Customer Service**
1. **Quick Response:** Reply to inquiries promptly
2. **WhatsApp Support:** Use provided number
3. **Return Policy:** Clear return guidelines
4. **Product Knowledge:** Know your inventory
5. **Follow-up:** Check customer satisfaction

## 📞 Support & Help

### **Common Issues**
- **Images not uploading:** Check file size and format
- **Orders not showing:** Refresh the page
- **Payment issues:** Check Razorpay configuration
- **Slow loading:** Clear browser cache

### **Getting Help**
- **Documentation:** Refer to this guide
- **Technical Support:** Contact developer
- **Razorpay Support:** Payment gateway issues
- **Cloudinary Support:** Image hosting issues

## 🔄 Regular Maintenance

### **Daily Tasks**
- Check new orders
- Update order statuses
- Monitor low stock alerts
- Respond to customer inquiries

### **Weekly Tasks**
- Review sales reports
- Update product information
- Check image quality
- Backup important data

### **Monthly Tasks**
- Analyze sales trends
- Update pricing if needed
- Review and optimize images
- Plan new product additions

---

**Your Bharat Pushpam admin panel is now ready to manage your plant business efficiently!** 🌱✨
