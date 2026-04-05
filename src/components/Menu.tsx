const Menu = () => {
  const menuItems = [
    {
      category: "BESTSELLER",
      items: [
        { name: "Biscoff Coffee", price: "180.00", description: "Biscoff-infused coffee" },
        { name: "S'mores Latte", price: "180.00", description: "S'mores flavored latte" },
        { name: "Dirty Matcha", price: "180.00", description: "Matcha with espresso shot" },
        { name: "Golden Banana Latte", price: "220.00", description: "Banana-infused latte" },
      ]
    },
    {
      category: "CLASSIC COFFEE",
      items: [
        { name: "Spanish Latte", price: "150.00", description: "Sweetened condensed milk latte" },
        { name: "Caramel Macchiato", price: "160.00", description: "Espresso with caramel" },
        { name: "Americano", price: "100.00", description: "Classic americano" },
        { name: "Cafe Latte", price: "130.00", description: "Classic cafe latte" },
      ]
    },
    {
      category: "MATCHA SERIES",
      items: [
        { name: "Strawberry Matcha", price: "180.00", description: "Strawberry matcha latte" },
        { name: "Matcha Milk", price: "180.00", description: "Classic matcha milk" },
        { name: "Ube Matcha", price: "180.00", description: "Ube matcha latte" },
        { name: "Seasalt Matcha", price: "180.00", description: "Sea salt matcha latte" },
      ]
    },
    {
      category: "SNACKS",
      items: [
        { name: "Shawarma", price: "59.00", description: "Classic shawarma wrap" },
        { name: "Nachos", price: "170.00", description: "Loaded nachos" },
        { name: "Pasta - Carbonara", price: "180.00", description: "Creamy carbonara" },
        { name: "Drip Chicken and Fries", price: "250.00", description: "Fried chicken with fries" },
      ]
    },
    {
      category: "BREAD",
      items: [
        { name: "Clubhouse Sandwich", price: "160.00", description: "With fries" },
        { name: "Croffle", price: "140.00", description: "7 flavors available" },
        { name: "Donut", price: "80.00", description: "Chocolate, Butternut, Bavarian" },
        { name: "Cookies", price: "99.00", description: "Per piece, 3 flavors" },
      ]
    },
    {
      category: "RICE MEALS",
      items: [
        { name: "Tapsilog", price: "180.00", description: "Tapa, egg, rice" },
        { name: "Sisigsilog", price: "180.00", description: "Sisig, egg, rice" },
        { name: "Chicken Tonkatsu", price: "180.00", description: "Breaded chicken cutlet with rice" },
        { name: "Tocilog", price: "160.00", description: "Tocino, egg, rice" },
      ]
    }
  ];

  return (
    <section id="menu" className="py-24 md:py-32 bg-secondary">
      <div className="container mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <p className="text-primary font-display text-sm tracking-[0.3em] mb-4">
            OFFERINGS
          </p>
          <h2 className="text-foreground">THE MENU</h2>
        </div>

        {/* Menu Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12" data-aos="fade-up">
          {menuItems.map((category) => (
            <div key={category.category} className="brutal-card bg-background">
              <h3 className="text-primary mb-8 pb-4 border-b border-border">
                {category.category}
              </h3>
              <div className="space-y-6">
                {category.items.map((item) => (
                  <div key={item.name} className="group">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-display font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                      <span className="font-display text-primary">₱{item.price}</span>
                    </div>
                    <p className="text-muted-foreground text-sm font-sans">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Seasonal specials rotate weekly. Ask your barista for today's selection.
          </p>
          <button className="btn-brutal">
            Full Menu PDF
          </button>
        </div>
      </div>
    </section>
  );
};

export default Menu;
