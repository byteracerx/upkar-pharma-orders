
import { Truck, Clock, CreditCard, Stethoscope } from "lucide-react";

const features = [
  {
    icon: <Stethoscope className="h-10 w-10" />,
    title: "For Medical Professionals",
    description: "Created exclusively for doctors and medical practitioners to simplify pharmaceutical ordering."
  },
  {
    icon: <Truck className="h-10 w-10" />,
    title: "Fast Delivery",
    description: "Quick and reliable delivery directly to your clinic or hospital."
  },
  {
    icon: <Clock className="h-10 w-10" />,
    title: "Save Time",
    description: "No more lengthy calls or manual processes. Order with just a few clicks."
  },
  {
    icon: <CreditCard className="h-10 w-10" />,
    title: "Credit System",
    description: "Flexible payment options with integrated credit management for registered doctors."
  }
];

const FeaturesSection = () => {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Upkar Pharma?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our platform is designed with medical professionals in mind, offering a streamlined approach to pharmaceutical ordering.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center text-center"
            >
              <div className="text-upkar-blue mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
