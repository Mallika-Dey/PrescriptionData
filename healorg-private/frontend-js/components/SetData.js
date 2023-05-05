const SetData = ({ data }) => {
    const { id, name, gender, email, organization, phoneno, usertype } = data;
    return ( 
        <>

        <div class="form-group">
            <label for="userid">UserID</label>
            <input type="text" class="form-control" id="userid" name="userid" value={id} placeholder={id} disabled/>
        </div>

        <div class = "form-row" >
           <div class="form-group col-md-6">
              <label for="username">Name</label>
              <input type="text" class="form-control" id="username" name="user_name" value={name} placeholder={name} disabled/>
            </div> 
        </div>

        <div class = "form-row" >
           <div class="form-group col-md-6">
              <label for="inputEmail4">Email</label>
              <input type="email" name="user_email" class="form-control" id="inputEmail4" placeholder={email} />
            </div> 
        </div> 
        <div class = "form-row" >
           <div class="form-group col-md-6">
              <label for="phone_num">Contact No</label>
              <input type="text" name="phone_num" class="form-control" id="phone_num" placeholder={phoneno} />
            </div>
            <div class="form-group col-md-4">
              <label for="org">Organization</label>
              <input type="text" name="org" class="form-control" id="org" value={organization} placeholder={organization} disabled/>
            </div> 
        </div>
        <button type = "submit" class = "btn btn-primary" > Update </button>

        </>
    )
}

export default SetData;