
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Dr. Rajesh Kumar",
    position: "Cardiologist, Delhi Heart Institute",
    quote: "Upkar Pharma has transformed how we order medications. The platform is intuitive and saves us hours each week.",
    image: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    name: "Dr. Priya Sharma",
    position: "General Physician, Family Care Clinic",
    quote: "The credit system is excellent, and the product catalog is comprehensive. Highly recommended for all physicians.",
    image: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    name: "Dr. Vikram Singh",
    position: "Pediatrician, Children's Hospital",
    quote: "Fast deliveries and excellent customer service. Upkar Pharma understands the needs of busy medical practitioners.",
    image: "https://randomuser.me/api/portraits/men/67.jpg"
  },
  {
    name: "Dr. Neha Patel",
    position: "Dermatologist, Skin Care Center",
    quote: "The platform is extremely easy to use and has all the medications I regularly prescribe. Great service!",
    image: "https://randomuser.me/api/portraits/women/17.jpg"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Doctors Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from medical professionals who have simplified their pharmaceutical ordering with Upkar Pharma.
          </p>
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden mb-4">
                        <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
                      <div>
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        <p className="text-sm text-gray-500">{testimonial.position}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};

export default TestimonialsSection;
