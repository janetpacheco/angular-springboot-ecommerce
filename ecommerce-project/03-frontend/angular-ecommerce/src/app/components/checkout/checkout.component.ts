import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  checkoutFormGroup : FormGroup;

  totalPrice: number= 0.00;
  totalQuantity: number= 0;

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit(): void {

    this.checkoutFormGroup = this.formBuilder.group(
      {
        customer : this.formBuilder.group({
          firstName: [''],
          lastName: [''],
          email: ['']
        }),

        shippingAddress : this.formBuilder.group({
          country: [''],
          street: [''],
          city: [''],
          state: [''],
          zipCode: ['']
        }),

        billingAddress : this.formBuilder.group({
          country: [''],
          street: [''],
          city: [''],
          state: [''],
          zipCode: ['']
        }),

        creditCardInfo : this.formBuilder.group({
          cardType: [''],
          cardName: [''],
          cardNumber: [''],
          securityCode: [''],
          expMonth: [''],
          expYear: ['']
        })
      }
    );
  }

  copyShippingAdressToBillingAddress(event){

    if(event.target.checked){
      this.checkoutFormGroup.controls['billingAddress']
      .setValue(this.checkoutFormGroup.controls['shippingAddress'].value);
    }
    else{
      this.checkoutFormGroup.controls['billingAddress'].reset();
    }
  }

  onSubmit(){
    console.log("Handling the submit button");
    console.log(this.checkoutFormGroup.get('customer').value)
    console.log("The email address is "+ this.checkoutFormGroup.get('customer').value.email);
  }

  

}
