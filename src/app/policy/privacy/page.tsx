export default function Privacy() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>
      
      <h3>1. Information We Collect</h3>
      <p>We collect information you provide directly to us when you create an account, make a purchase, or contact us.</p>
      
      <h3>2. How We Use Information</h3>
      <p>We use your information to process transactions, send order updates, and improve our inventory distribution logic.</p>
      
      <h3>3. Inventory Data</h3>
      <p>Please note that item availability is real-time and depends on physical stock at our partner locations.</p>
    </div>
  );
}