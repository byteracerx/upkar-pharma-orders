import Layout from "@/components/layout/Layout";

const About = () => {
  return (
    <Layout>
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">About Upkar Pharma</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-gray-700 mb-4">
              Upkar Pharma was founded with a simple mission: to make quality medicines accessible to healthcare professionals through a streamlined, digital-first approach. We believe that doctors should spend more time caring for patients and less time managing pharmaceutical supplies.
            </p>
            <p className="text-gray-700 mb-4">
              Our journey began in 2020 when a team of healthcare and technology professionals came together to address the inefficiencies in the traditional pharmaceutical supply chain. We recognized that doctors were spending valuable time on phone calls, paperwork, and follow-ups just to get the medicines they needed for their patients.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              At Upkar Pharma, our mission is to revolutionize how healthcare professionals access pharmaceutical products. We're committed to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Providing high-quality medicines at affordable prices</li>
              <li>Simplifying the ordering process through our digital platform</li>
              <li>Ensuring fast and reliable delivery to healthcare facilities</li>
              <li>Supporting healthcare professionals with flexible payment options</li>
              <li>Maintaining the highest standards of quality and compliance</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-medium mb-2 text-upkem-green">Quality</h3>
                <p className="text-gray-700">
                  We never compromise on the quality of our products. All our medicines are sourced from reputable manufacturers and undergo rigorous quality checks.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2 text-upkem-green">Integrity</h3>
                <p className="text-gray-700">
                  We operate with complete transparency and honesty in all our dealings with healthcare professionals and partners.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2 text-upkem-green">Innovation</h3>
                <p className="text-gray-700">
                  We continuously seek new ways to improve our services and make the pharmaceutical supply chain more efficient.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2 text-upkem-green">Customer-Centric</h3>
                <p className="text-gray-700">
                  We put our customers—healthcare professionals—at the center of everything we do, designing our services around their needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;