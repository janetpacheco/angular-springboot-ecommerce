import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Country } from 'src/app/common/country';
import { Order } from 'src/app/common/order';
import { OrderItem } from 'src/app/common/order-item';
import { PaymentInfo } from 'src/app/common/payment-info';
import { Purchase } from 'src/app/common/purchase';
import { State } from 'src/app/common/state';
import { CartService } from 'src/app/services/cart.service';
import { CheckoutService } from 'src/app/services/checkout.service';
import { HuskyShopFormService } from 'src/app/services/husky-shop-form-service.service';
import { HuskyShopValidators } from 'src/app/validators/husky-shop-validators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  
  checkoutFormGroup : FormGroup;

  totalPrice: number= 0.00;
  totalQuantity: number= 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  countries: Country[]=[];  

  shippingAddressStates: State[] = [];
  billingAddressStates: State[] = [];

  storage :Storage= sessionStorage;
  
  // initialize stripe API
  stripe = Stripe(environment.stripePublishableKey);

  paymentInfo : PaymentInfo = new PaymentInfo();
  cardElement: any;
  displayError: any ="";

  isDisabled: boolean = false;

  constructor(private formBuilder: FormBuilder,
              private huskyShopFormService: HuskyShopFormService,
              private cartService: CartService,
              private checkoutService : CheckoutService,
              private router: Router ) { }

  ngOnInit(): void {

    this.setupStripePaymentForm();

    this.reviewCartDetails();    

    //read from browser storage
    const theEmail = JSON.parse(this.storage.getItem('userEmail')!);

    this.checkoutFormGroup = this.formBuilder.group(
      {
        customer : this.formBuilder.group({
          firstName: new FormControl('',
                                       [Validators.required,
                                        Validators.minLength(2), 
                                        HuskyShopValidators.notOnlyWhitespace]),

          lastName: new FormControl('',[Validators.required,
                                        Validators.minLength(2),
                                        HuskyShopValidators.notOnlyWhitespace]),
                                                            
          email: new FormControl(theEmail,
                                [Validators.required,
                                 Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$')])
        }),

        shippingAddress : this.formBuilder.group({
          country: new FormControl('',Validators.required),
          street: new FormControl('',[Validators.required,
                                      Validators.minLength(2),
                                      HuskyShopValidators.notOnlyWhitespace]),
                           
          city: new FormControl('',[Validators.required,
                                    Validators.minLength(2),
                                    HuskyShopValidators.notOnlyWhitespace]),
                           
          state: new FormControl('',Validators.required),
          zipCode: new FormControl('',[Validators.required,
                                      Validators.minLength(2),
                                      HuskyShopValidators.notOnlyWhitespace]),
                           
        }),

        billingAddress : this.formBuilder.group({
          country: new FormControl('',Validators.required),
          street: new FormControl('',[Validators.required,
                                      Validators.minLength(2),
                                      HuskyShopValidators.notOnlyWhitespace]),
                           
          city: new FormControl('',[Validators.required,
                                    Validators.minLength(2),
                                    HuskyShopValidators.notOnlyWhitespace]),
                           
          state: new FormControl('',Validators.required),
          zipCode: new FormControl('',[Validators.required,
                                      Validators.minLength(2),
                                      HuskyShopValidators.notOnlyWhitespace])
                           
        }),

        creditCardInfo : this.formBuilder.group({
          /*
          cardType: new FormControl('',Validators.required),
          cardName: new FormControl('',[Validators.required,
                                        Validators.minLength(2),
                                        HuskyShopValidators.notOnlyWhitespace]),

          cardNumber: new FormControl('',[Validators.required,
                                          Validators.pattern('[0-9]{16}'),
                                          HuskyShopValidators.notOnlyWhitespace]),

          securityCode: new FormControl('',[Validators.required,
                                            Validators.pattern('[0-9]{3}'),                                            
                                            HuskyShopValidators.notOnlyWhitespace]),
          expMonth: [''],
          expYear: ['']
          */
        })
      }
    );

    /*
    // populate credit card months 
    const startMonth: number = new Date().getMonth() + 1;
    console.log("start month: "+ startMonth);

    this.huskyShopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("retrieve credit card months: " + JSON.stringify(data));
        this.creditCardMonths = data;
      }
    );

    // populate credit card and years
    this.huskyShopFormService.getCreditCardYears().subscribe(
      data => {
        console.log("retrieve credit card years: " + JSON.stringify(data));
        this.creditCardYears = data;
      }
    );*/

    // populate countries
    this.huskyShopFormService.getCountries().subscribe(
      data => {
        console.log("Retrieve countries: " + JSON.stringify(data));
        this.countries = data;
      }
    );
  }

  setupStripePaymentForm() {

    //handle stripe elements
    var elements = this.stripe.elements();
    
    //costumize card element
    this.cardElement = elements.create('card',{hidePostalCode : true});
    
    // instance of card UI comp into the card-element html
    this.cardElement.mount('#card-element');
    
    // event binding for the 'change' event on card element
    this.cardElement.on('change',(event) =>{
      
      // get a handle to card errors elements
      this.displayError = document.getElementById('card-errors');

      if(event.complete){
        this.displayError.textContent = "";
      } else if(event.error){
        this.displayError.textContent = event.error.message;
      }

    });
    
  }
  
  reviewCartDetails() {
    // subcribe to cartService total quantity and price
    this.cartService.totalPrice.subscribe(
      totalPrice => this.totalPrice = totalPrice);
    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity = totalQuantity);
  }

  get firstName(){ return this.checkoutFormGroup.get('customer.firstName');}
  get lastName(){ return this.checkoutFormGroup.get('customer.lastName');}
  get email(){ return this.checkoutFormGroup.get('customer.email');}

  get shippingAddressCountry(){ return this.checkoutFormGroup.get('shippingAddress.country');} 
  get shippingAddressStreet(){ return this.checkoutFormGroup.get('shippingAddress.street');}
  get shippingAddressCity(){ return this.checkoutFormGroup.get('shippingAddress.city');}                   
  get shippingAddressState(){ return this.checkoutFormGroup.get('shippingAddress.state');}
  get shippingAddressZipCode(){ return this.checkoutFormGroup.get('shippingAddress.zipCode');}

  get billingAddressCountry(){ return this.checkoutFormGroup.get('billingAddress.country');} 
  get billingAddressStreet(){ return this.checkoutFormGroup.get('billingAddress.street');}
  get billingAddressCity(){ return this.checkoutFormGroup.get('billingAddress.city');}                   
  get billingAddressState(){ return this.checkoutFormGroup.get('billingAddress.state');}
  get billingAddressZipCode(){ return this.checkoutFormGroup.get('billingAddress.zipCode');}

  get creditCardType(){ return this.checkoutFormGroup.get('creditCardInfo.cardType');}
  get creditCardName(){ return this.checkoutFormGroup.get('creditCardInfo.cardName');}
  get creditCardNumber(){ return this.checkoutFormGroup.get('creditCardInfo.cardNumber');}
  get creditSecurityCode(){ return this.checkoutFormGroup.get('creditCardInfo.securityCode');}

  
  
  copyShippingAdressToBillingAddress(event){

    if(event.target.checked){
      this.checkoutFormGroup.controls['billingAddress']
      .setValue(this.checkoutFormGroup.controls['shippingAddress'].value);
      this.billingAddressStates = this.shippingAddressStates;
    }    

    else{
      this.checkoutFormGroup.controls['billingAddress'].reset();

      // bug fix for states
      this.billingAddressStates = [];
    }
  }


  onSubmit(){

    console.log("Handling the submit button");

    if (this.checkoutFormGroup.invalid){
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }


    // console.log(this.checkoutFormGroup.get('customer').value)
    // console.log("The email address is "+ this.checkoutFormGroup.get('customer').value.email);
    
    // console.log("The shipping address country is " + this.checkoutFormGroup.get('shippingAddress').value.country.name);
    // console.log("The shipping address state is " + this.checkoutFormGroup.get('shippingAddress').value.state.name);

    // console.log("The billing address country is " + this.checkoutFormGroup.get('billingAddress').value.country.name);
    // console.log("The billing address state is " + this.checkoutFormGroup.get('billingAddress').value.state.name);

    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    const cartItems = this.cartService.cartItems;

    // traditional approach
    // let orderItems : OrderItem[] = [];
    // for(let i=0; i<cartItems.length; i++){
    //   orderItems[i] = new OrderItem(cartItems[i]);
    // }

    // another way using map
    let orderItems : OrderItem[] = cartItems.map(tempCartItem => new OrderItem(tempCartItem));
    
    // populate purchase 
    let purchase = new Purchase();

    // customer
    purchase.customer = this.checkoutFormGroup.controls['customer'].value;    

    // shipping address
    purchase.shippingAddress = this.checkoutFormGroup.controls['shippingAddress'].value;
    const shippingState: State = JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    const shippingCountry: Country = JSON.parse(JSON.stringify(purchase.shippingAddress.country));
    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    // billing address
    purchase.billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;
    const billingState: State = JSON.parse(JSON.stringify(purchase.billingAddress.state));
    const billingCountry: Country = JSON.parse(JSON.stringify(purchase.billingAddress.country));
    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;
    
    // order and orderItems 
    purchase.order = order ;   
    purchase.orderItems = orderItems;

    //exchange dollar to cents of dollars
    this.paymentInfo.amount = Math.round(this.totalPrice*100);

    this.paymentInfo.currency = "USD";
    console.log(`this.paymentInfo.amount: ${this.paymentInfo.amount}`);

    this.paymentInfo.receiptEmail = purchase.customer.email;

    /*
    // call REST API via CheckoutService without stripe 
    this.checkoutService.placeOrder(purchase).subscribe(
      {
        next: reponse =>{
          alert(`Your order has been received \nOrder tracking number: ${reponse.orderTrackingNumber}`);
          
          this.resetCart();
        },
        error : err=>{
          alert(`There was an error: ${err.message}`);
        }
      }
    );*/

    //

    if (!this.checkoutFormGroup.invalid && this.displayError.textContent === "") {
     
      this.isDisabled = true;

      this.checkoutService.createPaymentIntent(this.paymentInfo).subscribe(
        (paymentIntentResponse) => {
          this.stripe.confirmCardPayment(paymentIntentResponse.client_secret,
            {
              payment_method: {
                card: this.cardElement,
                billing_details:{
                  email: purchase.customer.email,
                  name: `${purchase.customer.firstName}  ${purchase.customer.lastName}`,
                  address:{
                    line2: purchase.billingAddress.street,
                    city: purchase.billingAddress.city,
                    state: purchase.billingAddress.state,
                    postal_code: purchase.billingAddress.zipCode,
                    country: this.billingAddressCountry.value.code
                  }
                }
              }
            }, { handleActions: false })
          .then(function(result) {
            if (result.error) {
              // inform the customer there was an error
              alert(`There was an error: ${result.error.message}`);
              this.isDisabled = false;
            } else {
              // call REST API via the CheckoutService
              this.checkoutService.placeOrder(purchase).subscribe({
                next: response => {
                  alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);

                  // reset cart
                  this.resetCart();  
                  this.isDisabled = false;                
                },
                error: err => {
                  alert(`There was an error: ${err.message}`);
                  this.isDisabled = false;
                }
              })
            }            
          }.bind(this));
        }
      );
    } else {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }
  }  

  resetCart() {
    // cart data
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    // empty the cart after reloading page and after checkingout 
    this.cartService.persistCartItems();

    // form data
    this.checkoutFormGroup.reset();


    this.router.navigateByUrl("/products");
  }


  /*
  handleMonthsAndYears(){
    const creditCardFormGroup = this.checkoutFormGroup.get('creditCardInfo');
    const currentYear : number = new Date().getFullYear();
    const selectedYear : number = Number(creditCardFormGroup.value.expYear);

    let startMonth: number;

    if ( currentYear === selectedYear){
      startMonth = new Date().getMonth() + 1 ;
    }else{
      startMonth = 1;
    }

    this.huskyShopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("Retrieved credit card months: " + JSON.stringify(data));
        this.creditCardMonths = data ;
      }
    );    
  }*/

  
  getStates(formGroupName: string) {

    const formGroup = this.checkoutFormGroup.get(formGroupName);

    const countryCode = formGroup.value.country.code;
    const countryName = formGroup.value.country.name;

    console.log(`${formGroupName} country code: ${countryCode}`);
    console.log(`${formGroupName} country name: ${countryName}`);

    this.huskyShopFormService.getStates(countryCode).subscribe(
      data => {

        if (formGroupName === 'shippingAddress') {
          this.shippingAddressStates = data; 
        }
        else {
          this.billingAddressStates = data;
        }

        // select first item by default
        formGroup.get('state').setValue(data[0]);
      }
    );
  }
}
