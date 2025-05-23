
import { DollarSign, Truck, Users } from "lucide-react";

const WhyChooseSection = () => {
  const features = [
    {
      icon: DollarSign,
      title: "Affordable Prices",
      description: "Get the best prices on quality medicines with transparent pricing and no hidden costs."
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Quick and reliable delivery to your doorstep with real-time tracking and updates."
    },
    {
      icon: Users,
      title: "Professional Support",
      description: "Dedicated support team of medical professionals to assist with your orders and queries."
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Upkar Pharma?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our platform is designed with medical professionals in mind, offering a streamlined approach
            to pharmaceutical ordering.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
