
import { Pill } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-100 pt-12 pb-6">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Pill className="h-6 w-6 text-upkar-blue mr-2" />
              <h3 className="font-poppins font-semibold text-lg">Upkar Pharma</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Making pharmaceutical ordering easier for medical professionals.
            </p>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Upkar Pharma. All rights reserved.
            </p>
          </div>
          
          <div>
            <h4 className="font-poppins font-medium text-md mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-upkar-blue transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-600 hover:text-upkar-blue transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-600 hover:text-upkar-blue transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-600 hover:text-upkar-blue transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-poppins font-medium text-md mb-4">Contact Us</h4>
            <ul className="space-y-2 text-gray-600">
              <li>Email: contact@upkarpharma.com</li>
              <li>Phone: +91 9876543210</li>
              <li>Address: 123 Healthcare Plaza, Medical District, Delhi</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-poppins font-medium text-md mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-upkar-blue transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-upkar-blue transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-upkar-blue transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-upkar-blue transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
