# Three-Way Match Engine for PO, GRN, and Invoice

A backend service that allows users to upload Purchase Order (PO), Goods Receipt Note (GRN), and Invoice documents, extract structured data using Gemini API, store the extracted data in MongoDB, and perform a three-way match.

## Approach

This implementation follows a modular architecture separating concerns into:
- **Models**: Define MongoDB schemas for PO, GRN, and Invoice documents
- **Controllers**: Handle HTTP requests and responses
- **Routes**: Define API endpoints
- **Services**: Contain business logic (Gemini parsing and matching algorithms)
- **Utilities**: Helper functions and configurations

## Data Model

### Purchase Order (PO)
```javascript
{
  poNumber: String (unique, required),
  vendorName: String (required),
  poDate: Date (required),
  items: [
    {
      itemCode: String (required),
      description: String,
      quantity: Number (required)
    }
  ],
  createdAt: Date (default: Date.now)
}
```

### Goods Receipt Note (GRN)
```javascript
{
  grnNumber: String (unique, required),
  poNumber: String (required),
  grnDate: Date (required),
  items: [
    {
      itemCode: String (required),
      description: String,
      receivedQuantity: Number (required)
    }
  ],
  createdAt: Date (default: Date.now)
}
```

### Invoice
```javascript
{
  invoiceNumber: String (unique, required),
  poNumber: String (required),
  invoiceDate: Date (required),
  items: [
    {
      itemCode: String (required),
      description: String,
      quantity: Number (required)
    }
  ],
  createdAt: Date (default: Date.now)
}
```

## Parsing Flow

1. User uploads a file (PDF, image, etc.) along with document type (po, grn, invoice)
2. File is processed by Multer and stored in memory as a buffer
3. Buffer is sent to Gemini API with a specialized prompt for the document type
4. Gemini extracts structured JSON data based on the prompt
5. Extracted data is validated and stored in the appropriate MongoDB collection
6. Matching logic is triggered to update match status for the associated PO number

## Matching Logic

The three-way matching is performed at the item level using itemCode as the matching key. This choice ensures accurate matching even when descriptions vary slightly between documents.

### Matching Rules Implemented:
1. **GRN quantity must not be greater than PO quantity**
2. **Invoice quantity must not be greater than total GRN quantity**
3. **Invoice quantity must not be greater than PO quantity**
4. **Invoice date must not be after PO date**

### Match Statuses:
- **matched**: All documents match perfectly according to rules
- **partially_matched**: Some items match, others have minor discrepancies
- **mismatch**: One or more validation rules are violated
- **insufficient_documents**: PO exists but missing GRN and/or Invoice

## Handling Out-of-Order Uploads

The system handles out-of-order uploads by:
1. Storing each document independently upon upload
2. Attempting matching whenever a new document is added for a PO number
3. Always returning the latest match state when requested
4. Not requiring any specific upload sequence (PO/GRN/Invoice can arrive in any order)

## Assumptions

1. ItemCode/SKU is the unique identifier for matching items across documents
2. Document uploads will include the correct documentType parameter
3. Gemini API is available and functioning correctly
4. MongoDB is running and accessible
5. File sizes are reasonable (limited to 10mb for processing)
6. Dates in documents are in a format that can be parsed by JavaScript Date

## Trade-offs

### What was prioritized:
- Correctness of matching algorithms
- Clear separation of concerns
- Proper error handling
- Extensible design for future enhancements

### What was simplified for scope:
- No user authentication/authorization
- No file type validation beyond what Multer provides
- Limited document preprocessing for Gemini
- No caching layer for frequent match queries
- No advanced OCR preprocessing for poor quality scans

## What I Would Improve With More Time

1. **Enhanced Document Processing**:
   - Better handling of various file formats (PDF, DOC, images)
   - Preprocessing to improve OCR accuracy
   - Fallback mechanisms for when Gemini fails to extract data

2. **Performance Optimizations**:
   - Database indexing on frequently queried fields
   - Caching layer for match results
   - Batch processing capabilities
   - Pagination for large result sets

3. **Robustness Features**:
   - Comprehensive file validation (types, sizes, virus scanning)
   - Retry mechanisms for external API calls
   - Better error reporting and logging
   - Unit and integration tests

4. **User Experience**:
   - API documentation with Swagger/OpenAPI
   - Webhook notifications for match completion
   - Bulk upload capabilities
   - Audit trail for document changes

5. **Deployment Ready**:
   - Docker containerization
   - Kubernetes deployment configurations
   - CI/CD pipeline integration
   - Environment-specific configurations

## API Usage Examples

### Upload a Document
```
POST /api/documents/upload
Content-Type: multipart/form-data

Form Data:
- file: [PO/GRN/Invoice PDF/image]
- documentType: "po" (or "grn", "invoice")
```

### Get Parsed Document
```
GET /api/documents/{documentId}
```

### Get Three-Way Match Result
```
GET /api/match/{poNumber}
```

## Sample Outputs

### Sample Parsed PO JSON:
```json
{
  "poNumber": "PO12345",
  "poDate": "2026-06-01",
  "vendorName": "ABC Supplies Inc.",
  "items": [
    {
      "itemCode": "SKU001",
      "description": "Widget A",
      "quantity": 100
    },
    {
      "itemCode": "SKU002",
      "description": "Widget B",
      "quantity": 50
    }
  ]
}
```

### Sample Match Result:
```json
{
  "poNumber": "PO12345",
  "status": "matched",
  "mismatchReasons": [],
  "documents": {
    "po": { /* PO document */ },
    "grns": [ /* Array of GRN documents */ ],
    "invoices": [ /* Array of Invoice documents */ ]
  }
}
```

## Running the Project

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/three-way-match
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Start MongoDB service

4. Start the server:
   ```bash
   npm start
   ```

5. API will be available at `http://localhost:3000`

## Project Structure
```
src/
├── controllers/          # Request handlers
├── models/              # Database schemas
├── routes/              # API endpoint definitions
├── utils/               # Services and helpers
└── server.js            # Application entry point
```

